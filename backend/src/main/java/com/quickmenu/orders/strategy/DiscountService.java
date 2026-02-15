package com.quickmenu.orders.strategy;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiscountService {

    private final List<DiscountStrategy> strategies;

    public DiscountStrategy getStrategy(String name) {
        return strategies.stream()
                .filter(s -> s.getStrategyName().equalsIgnoreCase(name))
                .findFirst()
                .orElse(strategies.stream()
                        .filter(s -> s instanceof NoDiscountStrategy)
                        .findFirst()
                        .orElseThrow());
    }
}
