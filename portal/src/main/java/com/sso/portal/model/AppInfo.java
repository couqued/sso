package com.sso.portal.model;

public class AppInfo {
    private String id;
    private String name;
    private String icon;
    private String url;
    private String requiredRole;

    public AppInfo(String id, String name, String icon, String url, String requiredRole) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.url = url;
        this.requiredRole = requiredRole;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getIcon() { return icon; }
    public String getUrl() { return url; }
    public String getRequiredRole() { return requiredRole; }
}
