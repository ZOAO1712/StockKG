package com.stockkg.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class StructuredAnswer {

    private String title = "";
    private String intro = "";
    private List<Section> sections = new ArrayList<>();

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title == null ? "" : title;
    }

    public String getIntro() {
        return intro;
    }

    public void setIntro(String intro) {
        this.intro = intro == null ? "" : intro;
    }

    public List<Section> getSections() {
        return sections;
    }

    public void setSections(List<Section> sections) {
        this.sections = sections == null ? new ArrayList<>() : sections;
    }

    public static class Section {
        private String heading = "";
        private String type = "paragraph";
        private String content = "";
        private List<String> items = new ArrayList<>();

        public String getHeading() {
            return heading;
        }

        public void setHeading(String heading) {
            this.heading = heading == null ? "" : heading;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type == null ? "paragraph" : type;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content == null ? "" : content;
        }

        public List<String> getItems() {
            return items;
        }

        public void setItems(List<String> items) {
            this.items = items == null ? new ArrayList<>() : items;
        }
    }
}