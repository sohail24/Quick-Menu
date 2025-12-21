package com.quickmenu.menu.repo;

import com.quickmenu.menu.model.Dish;
import org.springframework.data.jpa.domain.Specification;

public class DishSpecifications {
    public static Specification<Dish> belongsToRestaurant(String restaurantId) {
        return (root, query, cb) -> cb.equal(root.get("restaurantId"), restaurantId);
    }

    public static Specification<Dish> inCategory(String categoryId) {
        return (root, query, cb) -> cb.equal(root.get("categoryId"), categoryId);
    }

    public static Specification<Dish> nameOrTagsContains(String search) {
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%"),
                cb.like(cb.lower(root.get("tags")), "%" + search.toLowerCase() + "%")
        );
    }

    public static Specification<Dish> isAvailable(boolean includeUnavailable) {
        return includeUnavailable ? null : (root, query, cb) -> cb.isTrue(root.get("isAvailable"));
    }

}