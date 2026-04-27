package com.stockkg.backend.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class DashboardOverviewVO {

    private long nodeCount;
    private long relationCount;
    private long categoryCount;
    private double averageScore;

    private List<Map<String, Object>> topNodes = new ArrayList<>();
    private List<Map<String, Object>> categoryDistribution = new ArrayList<>();
    private List<Map<String, Object>> scoreList = new ArrayList<>();

    public long getNodeCount() {
        return nodeCount;
    }

    public void setNodeCount(long nodeCount) {
        this.nodeCount = nodeCount;
    }

    public long getRelationCount() {
        return relationCount;
    }

    public void setRelationCount(long relationCount) {
        this.relationCount = relationCount;
    }

    public long getCategoryCount() {
        return categoryCount;
    }

    public void setCategoryCount(long categoryCount) {
        this.categoryCount = categoryCount;
    }

    public double getAverageScore() {
        return averageScore;
    }

    public void setAverageScore(double averageScore) {
        this.averageScore = averageScore;
    }

    public List<Map<String, Object>> getTopNodes() {
        return topNodes;
    }

    public void setTopNodes(List<Map<String, Object>> topNodes) {
        this.topNodes = topNodes;
    }

    public List<Map<String, Object>> getCategoryDistribution() {
        return categoryDistribution;
    }

    public void setCategoryDistribution(List<Map<String, Object>> categoryDistribution) {
        this.categoryDistribution = categoryDistribution;
    }

    public List<Map<String, Object>> getScoreList() {
        return scoreList;
    }

    public void setScoreList(List<Map<String, Object>> scoreList) {
        this.scoreList = scoreList;
    }
}