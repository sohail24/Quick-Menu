package com.quickmenu.config;

import com.quickmenu.menu.model.Category;
import com.quickmenu.menu.model.Dish;
import com.quickmenu.menu.model.Restaurant;
import com.quickmenu.menu.model.TableEntity;
import com.quickmenu.menu.repo.CategoryRepository;
import com.quickmenu.menu.repo.DishRepository;
import com.quickmenu.menu.repo.RestaurantRepository;
import com.quickmenu.menu.repo.TableRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * DemoInfoController
 * ------------------
 * A small helper controller that allows the frontend or Postman tests
 * to dynamically discover the demo restaurant, table, categories and sample dishes.
 * It ensures the frontend can operate even when IDs are generated dynamically.
 */
@RestController
@RequestMapping("/api/demo")
public class DemoInfoController {

    private final RestaurantRepository restaurantRepo;
    private final TableRepository tableRepo;
    private final CategoryRepository categoryRepo;
    private final DishRepository dishRepo;

    public DemoInfoController(RestaurantRepository restaurantRepo,
                              TableRepository tableRepo,
                              CategoryRepository categoryRepo,
                              DishRepository dishRepo) {
        this.restaurantRepo = restaurantRepo;
        this.tableRepo = tableRepo;
        this.categoryRepo = categoryRepo;
        this.dishRepo = dishRepo;
    }

    /**
     * GET /api/demo/info
     *
     * Returns a lightweight JSON structure containing:
     * - demo restaurant id and name
     * - demo table id and qr url
     * - first few category names
     * - first 3 dish IDs and names
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> demoInfo() {
        Map<String, Object> resp = new LinkedHashMap<>();

        // Prefer restaurant named "Demo Bistro"
        Optional<Restaurant> demoOpt = restaurantRepo.findByName("Demo Bistro");
        Restaurant restaurant = demoOpt.orElseGet(() -> restaurantRepo.findAll().stream().findFirst().orElse(null));

        if (restaurant == null) {
            resp.put("error", "no_restaurant");
            resp.put("message", "No restaurants found in system. Run DataInitializer first.");
            return ResponseEntity.status(404).body(resp);
        }

        resp.put("restaurantId", restaurant.getId());
        resp.put("restaurantName", restaurant.getName());

        // find demo table (prefer "Table 1")
        Optional<TableEntity> tableOpt = tableRepo.findByRestaurantIdAndName(restaurant.getId(), "Table 1");
        if (tableOpt.isEmpty()) {
            // fallback to any table in the restaurant
            List<TableEntity> tables = tableRepo.findByRestaurantId(restaurant.getId());
            if (!tables.isEmpty()) {
                tableOpt = Optional.of(tables.get(0));
            }
        }

        if (tableOpt.isPresent()) {
            TableEntity t = tableOpt.get();
            resp.put("tableId", t.getId());
            resp.put("tableName", t.getName());
            resp.put("tableQrUrl", t.getQrUrl());
        } else {
            resp.put("tableId", null);
            resp.put("tableName", null);
            resp.put("tableQrUrl", null);
        }

        // categories
        try {
            List<Category> categories = categoryRepo
                    .findByRestaurantId(restaurant.getId(), Pageable.unpaged())
                    .getContent();
            List<Map<String, Object>> cats = new ArrayList<>();
            categories.stream()
                    .limit(5)
                    .forEach(cat -> {
                        Map<String, Object> c = new HashMap<>();
                        c.put("id", cat.getId());
                        c.put("name", cat.getName());
                        cats.add(c);
                    });
            resp.put("categories", cats);
        } catch (Exception e) {
            resp.put("categories", Collections.emptyList());
        }

        // sample dishes
        try {
            List<Dish> dishes = dishRepo.findByRestaurantId(restaurant.getId());
            List<Map<String, Object>> sampleDishes = new ArrayList<>();
            dishes.stream()
                    .limit(3)
                    .forEach(d -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", d.getId());
                        m.put("name", d.getName());
                        sampleDishes.add(m);
                    });
            resp.put("sampleDishes", sampleDishes);
        } catch (Exception e) {
            resp.put("sampleDishes", Collections.emptyList());
        }

        resp.put("note", "Use /menu/{restaurantId}?tableId={tableId} on frontend");

        return ResponseEntity.ok(resp);
    }
}
