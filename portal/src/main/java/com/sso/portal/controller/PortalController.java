package com.sso.portal.controller;

import com.sso.portal.config.AppRegistry;
import com.sso.portal.config.MenuConfig;
import com.sso.portal.model.AppInfo;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PortalController {

    private final AppRegistry appRegistry;
    private final MenuConfig menuConfig;

    public PortalController(AppRegistry appRegistry, MenuConfig menuConfig) {
        this.appRegistry = appRegistry;
        this.menuConfig = menuConfig;
    }

    @GetMapping("/apps")
    public List<Map<String, Object>> getApps(@AuthenticationPrincipal OAuth2User user) {
        List<String> userRoles = extractRoles(user);

        return appRegistry.getAll().stream()
            .map(app -> Map.of(
                "id", app.getId(),
                "name", app.getName(),
                "icon", app.getIcon(),
                "subscribed", userRoles.contains(app.getRequiredRole())
            ))
            .toList();
    }

    @GetMapping("/me")
    public Map<String, Object> getMe(@AuthenticationPrincipal OAuth2User user) {
        List<String> roles = extractRoles(user);
        List<String> allowedMenus = menuConfig.getAllowedMenuIds(roles);
        return Map.of(
            "username", user.getAttribute("preferred_username") != null
                ? user.getAttribute("preferred_username") : "",
            "email", user.getAttribute("email") != null
                ? user.getAttribute("email") : "",
            "roles", roles,
            "allowedMenus", allowedMenus
        );
    }

    // 앱에서 직접 포탈에 권한 정보를 조회할 수 있는 엔드포인트
    @GetMapping("/menu")
    public List<Map<String, String>> getMenu(@AuthenticationPrincipal OAuth2User user) {
        List<String> roles = extractRoles(user);
        return menuConfig.getAllowedMenus(roles).stream()
            .map(m -> Map.of("id", m.id(), "label", m.label()))
            .toList();
    }

    @SuppressWarnings("unchecked")
    static List<String> extractRoles(OAuth2User user) {
        Object rolesAttr = user.getAttribute("roles");
        if (rolesAttr instanceof List<?> list) {
            return list.stream()
                .filter(r -> r instanceof String)
                .map(r -> (String) r)
                .toList();
        }
        return List.of();
    }
}
