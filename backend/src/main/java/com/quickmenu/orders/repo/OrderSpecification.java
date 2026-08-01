package com.quickmenu.orders.repo;

import com.quickmenu.orders.model.Order;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class OrderSpecification {

    public static Specification<Order> withFilters(String restaurantId, Order.Status status, Instant startDate, Instant endDate) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Restaurant ID is mandatory
            predicates.add(cb.equal(root.get("restaurantId"), restaurantId));

            // Optional filters - only add if not null
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("placedAt"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("placedAt"), endDate));
            }

            // Exclude ghost orders (Online and Pending payment)
            // Staff should only see PAID online orders or CASH orders
            Predicate isCash = cb.equal(root.get("paymentMethod"), Order.PaymentMethod.CASH);
            Predicate isPaid = cb.equal(root.get("paymentStatus"), Order.PaymentStatus.PAID);
            predicates.add(cb.or(isCash, isPaid));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
