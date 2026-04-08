package com.sso.portal.config;

import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class MenuConfig {

    public record MenuItem(String id, String label) {}

    private static final List<MenuItem> ALL_MENUS = List.of(
        new MenuItem("data", "Data"),
        new MenuItem("myservice", "MyService"),
        new MenuItem("datacatalog", "DataCatalog"),
        new MenuItem("admin", "Admin")
    );

    // 역할별 접근 가능한 메뉴 정의
    private static final Map<String, List<String>> ROLE_MENUS = Map.of(
        "customer",  List.of("data", "myservice"),
        "developer", List.of("data", "myservice", "datacatalog"),
        "admin",     List.of("data", "myservice", "datacatalog", "admin")
    );

    public List<String> getAllowedMenuIds(List<String> userRoles) {
        Set<String> allowed = new LinkedHashSet<>();
        for (String role : userRoles) {
            List<String> menus = ROLE_MENUS.getOrDefault(role, List.of());
            allowed.addAll(menus);
        }
        // ALL_MENUS 순서 유지
        return ALL_MENUS.stream()
            .map(MenuItem::id)
            .filter(allowed::contains)
            .toList();
    }

    public List<MenuItem> getAllowedMenus(List<String> userRoles) {
        List<String> allowedIds = getAllowedMenuIds(userRoles);
        return ALL_MENUS.stream()
            .filter(m -> allowedIds.contains(m.id()))
            .toList();
    }
}
