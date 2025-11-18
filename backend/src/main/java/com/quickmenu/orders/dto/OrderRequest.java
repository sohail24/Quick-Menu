package com.quickmenu.orders.dto;

import lombok.Data;

import java.util.List;

@Data
public class OrderRequest {
    @Data
    public static class Item {
        public String dishId;
        public int quantity;
        public String note; // optional item-level note
    }

    private String tableId;
    private String customerName;
    private String customerPhone;
    private String customerNote; // overall note
    private List<Item> items;

    // getters & setters
    // or use Lombok @Data
}
