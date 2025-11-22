package com.quickmenu.auth.dto;

import com.quickmenu.auth.model.User;
import lombok.Data;

import java.util.List;

@Data
public class UserProfileResponse {

    private String id;
    private String email;
    private String name;
    private List<String> roles;

    private String assignedRestaurantId;   // staff use this
    private List<String> assignedRestaurantIds; // if multi-restaurant in future

    public static UserProfileResponse from(User user) {
        UserProfileResponse dto = new UserProfileResponse();
        dto.id = user.getId();
        dto.email = user.getEmail();
        dto.name = user.getName();
        dto.roles = List.of(user.getRole().name());

        // MVP: hardcode staff → their single assigned restaurant (we will extend later)
        dto.assignedRestaurantId = user.getAssignedRestaurantId();
        dto.assignedRestaurantIds = user.getAssignedRestaurantIds();

        return dto;
    }
}
