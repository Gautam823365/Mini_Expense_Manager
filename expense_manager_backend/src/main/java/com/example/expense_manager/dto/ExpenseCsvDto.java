package com.example.expense_manager.dto;

import com.opencsv.bean.CsvBindByName;
import lombok.Data;

@Data
public class ExpenseCsvDto {

    @CsvBindByName(column = "expenseDate")
    private String expenseDate;

    @CsvBindByName(column = "amount")
    private Double amount;

    @CsvBindByName(column = "vendorName")
    private String vendorName;

    @CsvBindByName(column = "description")
    private String description;
}
