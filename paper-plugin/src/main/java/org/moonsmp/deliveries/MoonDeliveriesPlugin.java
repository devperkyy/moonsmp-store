package org.moonsmp.deliveries;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.bukkit.Bukkit;
import org.bukkit.plugin.java.JavaPlugin;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

/**
 * Polls the Moon SMP webstore for pending deliveries, executes them as
 * console commands on the main thread, and reports results back.
 *
 * Outbound-only: the Minecraft server never needs an open port for this,
 * and pending purchases queue up on the webstore while the server is down.
 */
public final class MoonDeliveriesPlugin extends JavaPlugin {

    private HttpClient http;
    private String apiUrl;
    private String apiKey;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        apiUrl = getConfig().getString("api-url", "").replaceAll("/+$", "");
        apiKey = getConfig().getString("api-key", "");
        int pollSeconds = Math.max(3, getConfig().getInt("poll-seconds", 10));

        if (apiUrl.isEmpty() || apiKey.isEmpty() || apiKey.equals("changeme")) {
            getLogger().severe("Set api-url and api-key in plugins/MoonDeliveries/config.yml, then restart. Plugin is idle.");
            return;
        }

        http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        Bukkit.getScheduler().runTaskTimerAsynchronously(this, this::poll, 20L * 5, 20L * pollSeconds);
        getLogger().info("Polling " + apiUrl + " every " + pollSeconds + "s for deliveries.");
    }

    /** Runs on an async thread; command execution hops to the main thread. */
    private void poll() {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(apiUrl + "/api/plugin/deliveries"))
                    .header("Authorization", "Bearer " + apiKey)
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                getLogger().warning("Delivery poll failed: HTTP " + response.statusCode());
                return;
            }

            JsonArray deliveries = JsonParser.parseString(response.body())
                    .getAsJsonObject()
                    .getAsJsonArray("deliveries");
            if (deliveries == null || deliveries.isEmpty()) return;

            JsonArray results = new JsonArray();
            for (JsonElement element : deliveries) {
                JsonObject delivery = element.getAsJsonObject();
                String id = delivery.get("id").getAsString();
                String command = delivery.get("command").getAsString();

                JsonObject result = new JsonObject();
                result.addProperty("id", id);
                try {
                    Future<Boolean> dispatched = Bukkit.getScheduler().callSyncMethod(this,
                            () -> Bukkit.dispatchCommand(Bukkit.getConsoleSender(), command));
                    boolean ok = dispatched.get(10, TimeUnit.SECONDS);
                    result.addProperty("success", ok);
                    result.addProperty("response", ok
                            ? "Command dispatched"
                            : "dispatchCommand returned false (unknown command?)");
                    getLogger().info((ok ? "Delivered: " : "FAILED: ") + command);
                } catch (Exception ex) {
                    result.addProperty("success", false);
                    result.addProperty("response", "Exception: " + ex.getMessage());
                    getLogger().warning("Delivery failed: " + command + " -> " + ex);
                }
                results.add(result);
            }

            JsonObject payload = new JsonObject();
            payload.add("results", results);
            HttpRequest report = HttpRequest.newBuilder(URI.create(apiUrl + "/api/plugin/deliveries"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
                    .build();
            http.send(report, HttpResponse.BodyHandlers.ofString());
        } catch (Exception ex) {
            getLogger().warning("Delivery poll error: " + ex.getMessage());
        }
    }
}
