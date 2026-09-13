package net.gildedsmp.deliveries;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.bukkit.Bukkit;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.plugin.java.JavaPlugin;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.Method;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Delivers purchases only after the verified player is online and fully loaded. */
public final class GildedDeliveriesPlugin extends JavaPlugin implements Listener {

    private HttpClient http;
    private String apiUrl;
    private String apiKey;
    private String serverId;
    private long joinDelayMillis;
    private final Map<UUID, Long> joinedAt = new HashMap<>();
    private final Set<String> executed = new HashSet<>();
    private File executedFile;
    private YamlConfiguration executedYaml;
    private Method playerDataLoadedMethod;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        apiUrl = getConfig().getString("api-url", "").replaceAll("/+$", "");
        apiKey = getConfig().getString("api-key", "").trim();
        serverId = getConfig().getString("server-id", "").trim().toLowerCase();
        int pollSeconds = Math.max(5, getConfig().getInt("poll-seconds", 30));
        int joinDelaySeconds = Math.max(5, getConfig().getInt("join-delay-seconds", 5));
        joinDelayMillis = joinDelaySeconds * 1000L;

        if (apiUrl.isEmpty() || apiKey.isEmpty() || apiKey.equals("changeme")
                || serverId.isEmpty() || serverId.equals("change-me")) {
            getLogger().severe("Set api-url, api-key, and the unique server-id in plugins/GildedDeliveries/config.yml. Plugin is idle.");
            return;
        }

        loadExecutedLedger();
        findGildedSyncHook();
        http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        Bukkit.getPluginManager().registerEvents(this, this);
        long now = System.currentTimeMillis();
        for (Player player : Bukkit.getOnlinePlayers()) joinedAt.put(player.getUniqueId(), now);

        Bukkit.getScheduler().runTaskTimer(this, this::claimForEligiblePlayers,
                20L * joinDelaySeconds, 20L * pollSeconds);
        getLogger().info("Ready on server '" + serverId + "'; checking online players every " + pollSeconds + "s.");
    }

    @EventHandler
    public void onJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        joinedAt.put(player.getUniqueId(), System.currentTimeMillis());
        Bukkit.getScheduler().runTaskLater(this, () -> {
            if (eligible(player)) claimAsync(List.of(player));
        }, Math.max(1L, joinDelayMillis / 50L));
    }

    @EventHandler
    public void onQuit(PlayerQuitEvent event) {
        joinedAt.remove(event.getPlayer().getUniqueId());
    }

    /** Called on the main thread only; it snapshots Bukkit player objects before the web request. */
    private void claimForEligiblePlayers() {
        List<Player> players = new ArrayList<>();
        for (Player player : Bukkit.getOnlinePlayers()) {
            if (eligible(player)) players.add(player);
        }
        if (!players.isEmpty()) claimAsync(players);
    }

    private boolean eligible(Player player) {
        Long since = joinedAt.get(player.getUniqueId());
        return player.isOnline()
                && since != null
                && System.currentTimeMillis() - since >= joinDelayMillis
                && playerDataLoaded(player.getUniqueId());
    }

    private void claimAsync(Collection<Player> players) {
        JsonArray online = new JsonArray();
        for (Player player : players) {
            JsonObject item = new JsonObject();
            item.addProperty("uuid", player.getUniqueId().toString());
            item.addProperty("name", player.getName());
            online.add(item);
        }
        JsonObject payload = new JsonObject();
        payload.addProperty("serverId", serverId);
        payload.add("players", online);
        Bukkit.getScheduler().runTaskAsynchronously(this, () -> claim(payload));
    }

    private void claim(JsonObject payload) {
        try {
            HttpResponse<String> response = post("/api/plugin/deliveries/claim", payload);
            if (response.statusCode() != 200) {
                getLogger().warning("Delivery claim failed: HTTP " + response.statusCode());
                return;
            }
            JsonArray deliveries = JsonParser.parseString(response.body()).getAsJsonObject().getAsJsonArray("deliveries");
            if (deliveries == null) return;
            for (JsonElement element : deliveries) {
                JsonObject delivery = element.getAsJsonObject();
                Bukkit.getScheduler().runTask(this, () -> executeOnMainThread(delivery));
            }
        } catch (Exception ex) {
            getLogger().warning("Delivery claim error: " + ex.getMessage());
        }
    }

    /** Identity checks, the durable ledger, and command dispatch all happen together on the main thread. */
    private void executeOnMainThread(JsonObject delivery) {
        String id = delivery.get("id").getAsString();
        String token = delivery.get("claimToken").getAsString();
        String command = delivery.get("command").getAsString();
        String packageName = delivery.get("packageName").getAsString();
        boolean legacy = delivery.has("legacyNameMatch") && delivery.get("legacyNameMatch").getAsBoolean();
        Player player = findVerifiedPlayer(delivery, legacy);

        if (player == null || !eligible(player)) {
            reportAsync(id, token, "released", "Player left this server or their synced data is not loaded.");
            return;
        }
        if (executed.contains(id)) {
            getLogger().warning("Delivery " + id + " is already in executed.yml; reporting it without running twice.");
            reportAsync(id, token, "delivered", "Already present in the local exactly-once ledger.");
            return;
        }
        if (!rememberBeforeExecution(id)) {
            reportAsync(id, token, "released", "Could not save the local exactly-once ledger.");
            return;
        }

        try {
            boolean ok = Bukkit.dispatchCommand(Bukkit.getConsoleSender(), command);
            if (!ok) {
                getLogger().warning("Delivery failed (dispatchCommand returned false): " + command);
                reportAsync(id, token, "failed", "dispatchCommand returned false (unknown command?)");
                return;
            }
            getLogger().info("Delivered to " + player.getName() + ": " + command
                    + (legacy ? " (legacy exact-name match)" : " (verified UUID)"));
            player.sendMessage("§6Thanks for supporting Gilded SMP! §fYour " + packageName + " has been delivered.");
            reportAsync(id, token, "delivered", "Command dispatched on " + serverId);
        } catch (Exception ex) {
            getLogger().warning("Delivery command threw for " + id + ": " + ex.getMessage());
            reportAsync(id, token, "failed", "Exception: " + ex.getMessage());
        }
    }

    private Player findVerifiedPlayer(JsonObject delivery, boolean legacy) {
        if (legacy) {
            String expectedName = delivery.get("playerName").getAsString();
            Player player = Bukkit.getPlayerExact(expectedName);
            return player != null && player.getName().equals(expectedName) ? player : null;
        }
        try {
            UUID expected = UUID.fromString(delivery.get("playerUuid").getAsString());
            Player player = Bukkit.getPlayer(expected);
            return player != null && player.getUniqueId().equals(expected) ? player : null;
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private void reportAsync(String id, String token, String outcome, String response) {
        JsonObject payload = new JsonObject();
        payload.addProperty("id", id);
        payload.addProperty("claimToken", token);
        payload.addProperty("serverId", serverId);
        payload.addProperty("outcome", outcome);
        payload.addProperty("response", response);
        Bukkit.getScheduler().runTaskAsynchronously(this, () -> {
            try {
                HttpResponse<String> result = post("/api/plugin/deliveries/result", payload);
                if (result.statusCode() != 200) {
                    getLogger().warning("Delivery result rejected for " + id + ": HTTP " + result.statusCode());
                }
            } catch (Exception ex) {
                getLogger().warning("Could not report delivery " + id + ": " + ex.getMessage());
            }
        });
    }

    private HttpResponse<String> post(String path, JsonObject payload) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(apiUrl + path))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
                .build();
        return http.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private void loadExecutedLedger() {
        executedFile = new File(getDataFolder(), "executed.yml");
        executedYaml = YamlConfiguration.loadConfiguration(executedFile);
        executed.addAll(executedYaml.getStringList("executed"));
    }

    private boolean rememberBeforeExecution(String id) {
        executed.add(id);
        executedYaml.set("executed", new ArrayList<>(executed));
        try {
            executedYaml.save(executedFile);
            return true;
        } catch (IOException ex) {
            executed.remove(id);
            getLogger().severe("Refusing to run delivery " + id + " because executed.yml could not be saved: " + ex.getMessage());
            return false;
        }
    }

    private void findGildedSyncHook() {
        try {
            Class<?> bridge = Class.forName("net.gildedsmp.sync.api.SyncBridge");
            playerDataLoadedMethod = bridge.getMethod("playerDataLoaded", UUID.class);
            getLogger().info("Using GildedSync's player-data-loaded state.");
        } catch (ReflectiveOperationException ex) {
            playerDataLoadedMethod = null;
            getLogger().warning("GildedSync state hook is unavailable; using only join-delay-seconds.");
        }
    }

    private boolean playerDataLoaded(UUID playerId) {
        if (playerDataLoadedMethod == null) return true;
        try {
            return Boolean.TRUE.equals(playerDataLoadedMethod.invoke(null, playerId));
        } catch (ReflectiveOperationException ex) {
            getLogger().warning("GildedSync state check failed: " + ex.getMessage());
            return false;
        }
    }
}
