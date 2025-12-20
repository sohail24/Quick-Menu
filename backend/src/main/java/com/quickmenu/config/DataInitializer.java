package com.quickmenu.config;

import com.quickmenu.auth.model.Role;
import com.quickmenu.auth.model.User;
import com.quickmenu.auth.repo.UserRepository;
import com.quickmenu.menu.model.Category;
import com.quickmenu.menu.model.Dish;
import com.quickmenu.menu.model.Restaurant;
import com.quickmenu.menu.model.TableEntity;
import com.quickmenu.menu.repo.CategoryRepository;
import com.quickmenu.menu.repo.DishRepository;
import com.quickmenu.menu.repo.RestaurantRepository;
import com.quickmenu.menu.repo.TableRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepo;
    private final RestaurantRepository restaurantRepo;
    private final TableRepository tableRepo;
    private final CategoryRepository categoryRepo;
    private final DishRepository dishRepo;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepo,
                           RestaurantRepository restaurantRepo,
                           TableRepository tableRepo,
                           CategoryRepository categoryRepo,
                           DishRepository dishRepo,
                           PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.restaurantRepo = restaurantRepo;
        this.tableRepo = tableRepo;
        this.categoryRepo = categoryRepo;
        this.dishRepo = dishRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // ---------- Users ----------
        seedUsers();

        // ---------- Demo restaurant + table + categories + dishes ----------
        seedDemoRestaurant();
    }

    private void seedUsers() {
        // create admin
        String adminEmail = "admin@quickmenu.local";
        if (!userRepo.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setEmail(adminEmail);
            admin.setName("Demo Admin");
            // Adjust role field to your User model (string or set). Here we set role field as "ROLE_ADMIN".
            admin.setRole(Role.ROLE_ADMIN);
            admin.setPasswordHash(passwordEncoder.encode("Admin123!"));
            admin.setCreatedAt(Instant.now());
            userRepo.save(admin);
            System.out.println("Seeded admin -> email: " + adminEmail + " password: Admin123!");
        } else {
            System.out.println("Admin already exists: " + adminEmail);
        }
    }
    private void seedDemoRestaurant() {
        String demoName = "Demo Bistro";
        Optional<Restaurant> existing = restaurantRepo.findByName(demoName);
        Restaurant r;
        if (existing.isPresent()) {
            r = existing.get();
            System.out.println("Demo restaurant exists: id=" + r.getId());
        } else {
            r = Restaurant.builder()
                    //.id("demoID12345678910111213141516171") // manually setting 32 length ID
                    .name(demoName)
                    .timezone("Asia/Kolkata")
                    .currency("INR")
                    .ownerUserId(null)
                    .createdAt(Instant.now())
                    .build();
            r = restaurantRepo.save(r);
            System.out.println("Created demo restaurant: id=" + r.getId());
        }

        // Create a demo table
        String tableName = "Table 1";
        Optional<TableEntity> tOpt = tableRepo.findByRestaurantIdAndName(r.getId(), tableName);
        TableEntity table;
        if (tOpt.isPresent()) {
            table = tOpt.get();
            System.out.println("Demo table exists: id=" + table.getId());
        } else {
            // simple QR url encoded with restaurantId & tableId placeholder (frontend will navigate to menu with tableId param)
            String qrUrl = "/menu/" + r.getId() + "?tableId=table-1";
            // If you store full URL, build using your app base url:
            // String qrUrlFull = "https://your-frontend-host/menu/" + r.getId() + "?tableId=" + URLEncoder.encode("table-1", StandardCharsets.UTF_8);

            table = TableEntity.builder()
                    .restaurantId(r.getId())
                    .name(tableName)
                    .qrUrl(qrUrl)
                    .createdAt(Instant.now())
                    .occupied(false)
                    .build();
            table = tableRepo.save(table);
            System.out.println("Created demo table: id=" + table.getId() + " qrUrl=" + qrUrl);
            // saving one more table
            TableEntity table2 = TableEntity.builder()
                    .restaurantId(r.getId())
                    .name("Table 2")
                    .qrUrl( "/menu/" + r.getId() + "?tableId=table-2")
                    .createdAt(Instant.now())
                    .occupied(false)
                    .build();
            table2 = tableRepo.save(table2);
            System.out.println("Created demo table: id=" + table2.getId() + " qrUrl=" +  "/menu/" + r.getId() + "?tableId=table-2");
        }

        // Create categories if missing
        Restaurant finalR = r;
        Category starters = (Category) categoryRepo.findByRestaurantIdAndName(r.getId(), "Starters")
                .orElseGet(() -> categoryRepo.save(Category.builder()
                        .restaurantId(finalR.getId())
                        .name("Starters")
                        .orderIndex(1)
                        .createdAt(Instant.now())
                        .build()));

        Restaurant finalR1 = r;
        Category mains = (Category) categoryRepo.findByRestaurantIdAndName(r.getId(), "Mains")
                .orElseGet(() -> categoryRepo.save(Category.builder()
                        .restaurantId(finalR1.getId())
                        .name("Mains")
                        .orderIndex(2)
                        .createdAt(Instant.now())
                        .build()));

        // Seed dishes if not exist
        if (dishRepo.countByRestaurantId(r.getId()) == 0) {
            List<Dish> dishes = new ArrayList<>();
            dishes.add(Dish.builder()
                    .restaurantId(r.getId())
                    .categoryId(starters.getId())
                    .name("Paneer Tikka")
                    .description("Grilled paneer with spices.")
                    .price(BigDecimal.valueOf(229.0))
                    .imageUrl("http://localhost:8080/uploads/Dish_Paneer_Tikka.png")
                    .isAvailable(true)
                    .prepTimeMins(10)
                    .createdAt(Instant.now())
                    .build());

            dishes.add(Dish.builder()
                    .restaurantId(r.getId())
                    .categoryId(starters.getId())
                    .name("Veg Spring Roll")
                    .description("Crispy rolls with veg filling.")
                    .price(BigDecimal.valueOf(149.0))
                    .imageUrl("http://localhost:8080/uploads/Dish_Spring_Roll.png")
                    .isAvailable(true)
                    .prepTimeMins(8)
                    .createdAt(Instant.now())
                    .build());

            dishes.add(Dish.builder()
                    .restaurantId(r.getId())
                    .categoryId(mains.getId())
                    .name("Butter Chicken")
                    .description("Creamy tomato gravy with tender chicken.")
                    .price(BigDecimal.valueOf(299.0))
                    .imageUrl("http://localhost:8080/uploads/Dish_Butter_Chicken.png")
                    .isAvailable(true)
                    .prepTimeMins(20)
                    .createdAt(Instant.now())
                    .build());

            dishes.add(Dish.builder()
                    .restaurantId(r.getId())
                    .categoryId(mains.getId())
                    .name("Jeera Rice")
                    .description("Aromatic cumin rice.")
                    .price(BigDecimal.valueOf(99.0))
                    .imageUrl("http://localhost:8080/uploads/Dish_Jeera_Rice.png")
                    .isAvailable(true)
                    .prepTimeMins(5)
                    .createdAt(Instant.now())
                    .build());

            dishRepo.saveAll(dishes);
            System.out.println("Seeded " + dishes.size() + " demo dishes for restaurant: " + r.getId());
        } else {
            System.out.println("Dishes already present for restaurant: " + r.getId());
        }

        // create seed staff
        String staffEmail = "staff@quickmenu.local";
        if (!userRepo.existsByEmail(staffEmail)) {
            User staff = new User();
            staff.setEmail(staffEmail);
            staff.setName("Demo Staff");
            staff.setRole(Role.ROLE_STAFF);
            staff.setPasswordHash(passwordEncoder.encode("Staff123!"));
            staff.setCreatedAt(Instant.now());
            staff.setAssignedRestaurantId(r.getId()); //demo restaurant
            userRepo.save(staff);
            System.out.println("Seeded staff -> email: " + staffEmail + " password: Staff123!");
        } else {
            System.out.println("Staff already exists: " + staffEmail);
        }

        // Print summary for quick testing
        System.out.println("=== DEMO DATA SUMMARY ===");
        System.out.println("restaurantId=" + r.getId());
        System.out.println("tableId=" + table.getId());
        System.out.println("tableQrUrl=" + table.getQrUrl());
        System.out.println("Staff login -> email=staff@quickmenu.local password=Staff123!");
        System.out.println("Admin login -> email=admin@quickmenu.local password=Admin123!");
        System.out.println("=========================");
    }
}
