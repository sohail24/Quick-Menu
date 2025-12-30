package com.quickmenu.menu.service;

import com.quickmenu.menu.model.Restaurant;
import com.quickmenu.menu.repo.RestaurantRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    public RestaurantService(RestaurantRepository restaurantRepository) {
        this.restaurantRepository = restaurantRepository;
    }

    public Restaurant create(Restaurant restaurant) {
        return restaurantRepository.save(restaurant);
    }

    public List<Restaurant> listAll() {
        return restaurantRepository.findAll();
    }

    public Restaurant getById(String id) {
        return restaurantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));
    }

    public Restaurant update(String id, Restaurant updated) {
        Restaurant existing = getById(id);
        existing.setName(updated.getName() != null ? updated.getName() : existing.getName());
        existing.setTimezone(updated.getTimezone() != null ? updated.getTimezone() : existing.getTimezone());
        existing.setCurrency(updated.getCurrency() != null ? updated.getCurrency() : existing.getCurrency());
        existing.setAddress(updated.getAddress() != null ? updated.getAddress() : existing.getAddress());
        return restaurantRepository.save(existing);
    }

    public void delete(String id) {
        restaurantRepository.findById(id).ifPresent(restaurant -> {
            if (Boolean.TRUE.equals(restaurant.getIsDemo())) {
                restaurant.setDeletedAt(java.time.Instant.now());
                restaurantRepository.save(restaurant);
            } else {
                restaurantRepository.delete(restaurant);
            }
        });
    }
}
