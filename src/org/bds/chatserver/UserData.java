package org.bds.chatserver;

/**
 * Created by bdomokos on 09/10/16.
 */
public class UserData {
    private String name;

    public UserData(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        UserData userData = (UserData) o;

        return !(name != null ? !name.equals(userData.name) : userData.name != null);

    }

    @Override
    public int hashCode() {
        return name != null ? name.hashCode() : 0;
    }
}
