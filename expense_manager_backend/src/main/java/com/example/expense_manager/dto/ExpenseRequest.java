package com.example.expense_manager.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ExpenseRequest {
    private LocalDate expenseDate;
    private BigDecimal amount;
    private String vendorName;
    private String description;
    private String category;
}
