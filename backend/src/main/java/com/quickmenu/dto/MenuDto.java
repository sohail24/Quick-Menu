package com.quickmenu.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class MenuDto {
    @Data
    public static class DishDto {
        private String id;
        private String categoryId;
        private String name;
        private String description;
        private BigDecimal price;
        private String imageUrl;
        private Boolean isAvailable;
        private Integer prepTimeMins;
    }

    @Data
    public static class CategoryDto {
        private String id;
        private String name;
        private Integer orderIndex;
    }

    private List<CategoryDto> categories;
    private List<DishDto> dishes;
}
