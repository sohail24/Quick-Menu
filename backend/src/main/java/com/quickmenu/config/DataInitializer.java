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
import com.quickmenu.orders.model.Order;
import com.quickmenu.orders.model.OrderItem;
import com.quickmenu.orders.repo.OrderRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Component
@Slf4j
public class DataInitializer {

    private final UserRepository userRepo;
    private final RestaurantRepository restaurantRepo;
    private final TableRepository tableRepo;
    private final CategoryRepository categoryRepo;
    private final DishRepository dishRepo;
    private final PasswordEncoder passwordEncoder;
    private final OrderRepository orderRepo;
    private final com.quickmenu.orders.repo.OrderItemRepository orderItemRepo;

    public DataInitializer(UserRepository userRepo,
                           RestaurantRepository restaurantRepo,
                           TableRepository tableRepo,
                           CategoryRepository categoryRepo,
                           DishRepository dishRepo,
                           PasswordEncoder passwordEncoder,
                           OrderRepository orderRepo,
                           com.quickmenu.orders.repo.OrderItemRepository orderItemRepo) {
        this.userRepo = userRepo;
        this.restaurantRepo = restaurantRepo;
        this.tableRepo = tableRepo;
        this.categoryRepo = categoryRepo;
        this.dishRepo = dishRepo;
        this.passwordEncoder = passwordEncoder;
        this.orderRepo = orderRepo;
        this.orderItemRepo = orderItemRepo;
    }

    public void resetDemoData() {
        // 1. Truncate demo records in reverse dependency order
        // IMPORTANT: order_items can reference both orders AND dishes via foreign keys.
        // We must clear all referencing records before deleting the referenced entities.
        log.info("Truncating existing demo data...");
        
        // First, delete order_items that reference demo orders OR demo dishes
        orderItemRepo.deleteAllByOrderIsDemoTrue();
        orderItemRepo.deleteAllByDishIsDemoTrue();
        
        // Now we can safely delete orders and dishes
        orderRepo.deleteAllByIsDemoTrue();
        dishRepo.deleteAllByIsDemoTrue();
        
        // Continue with the rest
        categoryRepo.deleteAllByIsDemoTrue();
        tableRepo.deleteAllByIsDemoTrue();
        restaurantRepo.deleteAllByIsDemoTrue();
        userRepo.deleteAllByIsDemoTrue();

        // 2. Re-seed demo data
        log.info("Seeding fresh demo users and restaurant...");
        seedUsers();
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
            admin.setEnabled(true);
            admin.setIsDemo(true);
            userRepo.save(admin);
                log.info("Seeded admin -> email: {} password: Admin123!", adminEmail);
        } else {
            log.info("Admin already exists: {}", adminEmail);
        }
    }
    private void seedDemoRestaurant() {
        String demoName = "Demo Bistro";
        Optional<Restaurant> existing = restaurantRepo.findByName(demoName);
        Restaurant r;
        if (existing.isPresent()) {
            r = existing.get();
            log.info("Demo restaurant exists: id={}", r.getId());
        } else {
            r = Restaurant.builder()
                    //.id("demoID12345678910111213141516171") // manually setting 32 length ID
                    .name(demoName)
                    .description("This is a demo/test restaurant for the quick menu.")
                    .address("Pune, India")
                    .planId("Free")
                    .bannerUrl("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop")
                    .timezone("Asia/Kolkata")
                    .currency("INR")
                    .ownerUserId("admin@quickmenu.local") // admin is the owner
                    .ownerUserId("admin@quickmenu.local") // admin is the owner
                    .createdAt(Instant.now())
                    .isDemo(true)
                    .build();
            r = restaurantRepo.save(r);
            log.info("Created demo restaurant: id={}", r.getId());
        }

        // Create a demo table
        String tableName = "Table 1";
        Optional<TableEntity> tOpt = tableRepo.findByRestaurantIdAndName(r.getId(), tableName);
        TableEntity table;
        if (tOpt.isPresent()) {
            table = tOpt.get();
            log.info("Demo table exists: id={}", table.getId());
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
                    .isDemo(true)
                    .build();
            table = tableRepo.save(table);
            log.info("Created demo table: id={} qrUrl={}", table.getId(), qrUrl);
            // saving one more table
            TableEntity table2 = TableEntity.builder()
                    .restaurantId(r.getId())
                    .name("Table 2")
                    .qrUrl( "/menu/" + r.getId() + "?tableId=table-2")
                    .createdAt(Instant.now())
                    .occupied(false)
                    .isDemo(true)
                    .build();
            table2 = tableRepo.save(table2);
            log.info("Created demo table: id={} qrUrl={}", table2.getId(),  "/menu/" + r.getId() + "?tableId=table-2");
        }

        // Create categories if missing
        Restaurant finalR = r;
        Category starters = (Category) categoryRepo.findByRestaurantIdAndName(r.getId(), "Starters")
                .orElseGet(() -> categoryRepo.save(Category.builder()
                        .restaurantId(finalR.getId())
                        .name("Starters")
                        .orderIndex(2)
                        .createdAt(Instant.now())
                        .isDemo(true)
                        .build()));

        Restaurant finalR1 = r;
        Category mains = (Category) categoryRepo.findByRestaurantIdAndName(r.getId(), "Mains")
                .orElseGet(() -> categoryRepo.save(Category.builder()
                        .restaurantId(finalR1.getId())
                        .name("Mains")
                        .orderIndex(3)
                        .createdAt(Instant.now())
                        .isDemo(true)
                        .build()));

        Category combo = (Category) categoryRepo.findByRestaurantIdAndName(r.getId(), "Combo")
                .orElseGet(() -> categoryRepo.save(Category.builder()
                        .restaurantId(finalR.getId())
                        .name("Combo")
                        .orderIndex(1)
                        .createdAt(Instant.now())
                        .isDemo(true)
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
                    .imageUrl("https://res.cloudinary.com/dd0vsg58y/image/upload/f_auto,q_auto/v1767455131/vkiphqhjqeav3ozv811s.png")
                    .isAvailable(true)
                    .prepTimeMins(10)
                    .tags("Spicy,Tandoori,Soft,Paneer")
                    .createdAt(Instant.now())
                    .isDemo(true)
                    .build());

            dishes.add(Dish.builder()
                    .restaurantId(r.getId())
                    .categoryId(starters.getId())
                    .name("Veg Spring Roll")
                    .description("Crispy rolls with veg filling.")
                    .price(BigDecimal.valueOf(149.0))
                    .imageUrl("https://res.cloudinary.com/dd0vsg58y/image/upload/f_auto,q_auto/v1767455391/uzbjzj1ombz1sv20qf1d.png")
                    .isAvailable(true)
                    .prepTimeMins(8)
                    .tags("Crispy,Fried,Onions,Cabbage,DeepFried")
                    .createdAt(Instant.now())
                    .isDemo(true)
                    .build());

            dishes.add(Dish.builder()
                    .restaurantId(r.getId())
                    .categoryId(mains.getId())
                    .name("Butter Chicken")
                    .description("Creamy tomato gravy with tender chicken.")
                    .price(BigDecimal.valueOf(299.0))
                    .imageUrl("https://res.cloudinary.com/dd0vsg58y/image/upload/f_auto,q_auto/v1767454817/tsq2scj91pwvmff6u8rq.png")
                    .isAvailable(true)
                    .prepTimeMins(20)
                    .tags("Creamy,Tomatao,Butter,Chicken,ButterChicken")
                    .createdAt(Instant.now())
                    .isDemo(true)
                    .build());

            dishes.add(Dish.builder()
                    .restaurantId(r.getId())
                    .categoryId(mains.getId())
                    .name("Jeera Rice")
                    .description("Aromatic cumin rice.")
                    .price(BigDecimal.valueOf(99.0))
                    .imageUrl("https://res.cloudinary.com/dd0vsg58y/image/upload/f_auto,q_auto/v1767455072/omu5nhhsmmkfoepn8ifl.png")
                    .isAvailable(true)
                    .prepTimeMins(5)
                    .tags("Plain,Jeera,Rice,Cumin")
                    .createdAt(Instant.now())
                    .isDemo(true)
                    .build());

            dishes.add(Dish.builder()
                    .restaurantId(r.getId())
                    .categoryId(combo.getId())
                    .name("Jeera Rice with Veg Spring Roll")
                    .description("Soft jeera rice with crispy veg spring roll for your tastebuds.")
                    .price(BigDecimal.valueOf(199.0))
                    .imageUrl("https://res.cloudinary.com/dd0vsg58y/image/upload/f_auto,q_auto/v1767463018/xdsvzk98ug1uvws0cwol.png")
                    .isAvailable(true)
                    .prepTimeMins(14)
                    .tags("Cumin,Jeera,Onions,Rice,Fried,SpringRoll")
                    .createdAt(Instant.now())
                    .isDemo(true)
                    .build());

            dishRepo.saveAll(dishes);
            log.info("Seeded {} demo dishes for restaurant: {}", dishes.size(), r.getId());
        } else {
            log.info("Dishes already present for restaurant: {}", r.getId());
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
            staff.setEnabled(true);
            staff.setIsDemo(true);
            userRepo.save(staff);
            log.info("Seeded staff -> email: {} password: Staff123!", staffEmail);
        } else {
            log.info("Staff already exists: {}", staffEmail);
        }

        // After seeding dishes and staff
        if (orderRepo.findByRestaurantId(r.getId()).isEmpty()) {
            TableEntity demoTable1 = tableRepo.findByRestaurantIdAndName(r.getId(), "Table 1")
                    .orElseThrow();
            TableEntity demoTable2 = tableRepo.findByRestaurantIdAndName(r.getId(), "Table 2")
                    .orElseThrow();
            List<Dish> dishes = dishRepo.findByRestaurantId(r.getId());

            // First demo order
            Order order1 = Order.builder()
                    .restaurantId(r.getId())
                    .tableId(demoTable1.getId())
                    .customerName("John Doe")
                    .customerPhone("9999999999")
                    .customerNote("Extra spicy please")
                    .status(Order.Status.SERVED)
                    .placedAt(Instant.now().minusSeconds(3600)) // 1 hour ago
                    .isDemo(true)
                    .build();

            OrderItem item1 = OrderItem.builder()
                    .order(order1)
                    .dish(dishes.get(0))
                    .dishName(dishes.get(0).getName())
                    .quantity(2)
                    .priceAtOrder(dishes.get(0).getPrice())
                    .note("No onions")
                    .build();

            OrderItem item2 = OrderItem.builder()
                    .order(order1)
                    .dish(dishes.get(1))
                    .dishName(dishes.get(1).getName())
                    .quantity(1)
                    .priceAtOrder(dishes.get(1).getPrice())
                    .build();

            order1.setItems(List.of(item1, item2));
            order1.setTotalAmount(
                    dishes.get(0).getPrice().multiply(BigDecimal.valueOf(2))
                            .add(dishes.get(1).getPrice())
            );

            // Second demo order
            Order order2 = Order.builder()
                    .restaurantId(r.getId())
                    .tableId(demoTable2.getId())
                    .customerName("Jane Smith")
                    .customerPhone("8888888888")
                    .customerNote("Serve quickly")
                    .status(Order.Status.SERVED)
                    .placedAt(Instant.now().minusSeconds(1800)) // 30 mins ago
                    .isDemo(true)
                    .build();

            OrderItem item3 = OrderItem.builder()
                    .order(order2)
                    .dish(dishes.get(2))
                    .dishName(dishes.get(2).getName())
                    .quantity(1)
                    .priceAtOrder(dishes.get(2).getPrice())
                    .build();

            OrderItem item4 = OrderItem.builder()
                    .order(order2)
                    .dish(dishes.get(3))
                    .dishName(dishes.get(3).getName())
                    .quantity(2)
                    .priceAtOrder(dishes.get(3).getPrice())
                    .build();

            order2.setItems(List.of(item3, item4));
            order2.setTotalAmount(
                    dishes.get(2).getPrice()
                            .add(dishes.get(3).getPrice().multiply(BigDecimal.valueOf(2)))
            );

            orderRepo.saveAll(List.of(order1, order2));
            log.info("Seeded 2 demo orders in SERVED state for restaurant: {}", r.getName());
        }

        // Print summary for quick testing
        log.info("=== DEMO DATA SUMMARY ===");
        log.info("restaurantId={}", r.getId());
        log.info("tableId={}", table.getId());
        log.info("tableQrUrl={}", table.getQrUrl());
        log.info("Staff login -> email=staff@quickmenu.local password=Staff123!");
        log.info("Admin login -> email=admin@quickmenu.local password=Admin123!");
        log.info("=========================");
    }
}
