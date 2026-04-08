package com.sso.portal.config;

import com.sso.portal.model.AppInfo;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class AppRegistry {

    private final List<AppInfo> apps = List.of(
        new AppInfo("app1", "Analytics Dashboard", "chart-bar",
                    "http://app1.sso.local", "app1-subscriber"),
        new AppInfo("app2", "Document Manager", "folder",
                    "http://app2.sso.local", "app2-subscriber"),
        new AppInfo("app3", "HR Portal", "users",
                    "http://app3.sso.local", "app3-subscriber"),
        new AppInfo("app4", "Finance Tracker", "currency-dollar",
                    "http://app4.sso.local", "app4-subscriber"),
        new AppInfo("app5", "Support Center", "ticket",
                    "http://app5.sso.local", "app5-subscriber")
    );

    public List<AppInfo> getAll() {
        return apps;
    }

    public Optional<AppInfo> findById(String id) {
        return apps.stream().filter(a -> a.getId().equals(id)).findFirst();
    }
}
