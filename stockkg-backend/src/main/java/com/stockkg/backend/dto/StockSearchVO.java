package com.stockkg.backend.dto;

public class StockSearchVO {

    private String code;
    private String name;
    private String company;
    private String industry;

    public StockSearchVO() {
    }

    public StockSearchVO(String code, String name, String company, String industry) {
        this.code = code;
        this.name = name;
        this.company = company;
        this.industry = industry;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }
}