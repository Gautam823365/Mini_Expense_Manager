package com.example.expense_manager.service;

import com.example.expense_manager.dto.ExpenseRequest;
import com.example.expense_manager.entity.Expense;
import com.example.expense_manager.entity.User;
import com.example.expense_manager.entity.VendorCategoryMapping;
import com.example.expense_manager.repository.ExpenseRepository;
import com.example.expense_manager.repository.UserRepository;
import com.example.expense_manager.repository.VendorCategoryRepository;
import org.springframework.stereotype.Service;

import org.apache.commons.csv.*;
import org.apache.commons.io.input.BOMInputStream;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
public class ExpenseService {

    private final VendorCategoryRepository vendorCategoryRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public ExpenseService(VendorCategoryRepository vendorCategoryRepository,
                          ExpenseRepository expenseRepository,
                          UserRepository userRepository) {
        this.vendorCategoryRepository = vendorCategoryRepository;
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    // ================= SINGLE EXPENSE =================

    public Expense addExpense(ExpenseRequest request) {

        User currentUser = getCurrentUser();

        Expense expense = Expense.builder()
                .expenseDate(request.getExpenseDate())
                .amount(request.getAmount())
                .vendorName(request.getVendorName())
                .description(request.getDescription())
                .category(request.getCategory())
                .user(currentUser)
                .build();

        return expenseRepository.save(expense);
    }

    public List<Expense> getAllExpenses() {
        User currentUser = getCurrentUser();
        return expenseRepository.findByUser(currentUser);
    }

    public void deleteExpense(Long id) {
        if (!expenseRepository.existsById(id)) {
            throw new RuntimeException("Expense not found with id: " + id);
        }
        expenseRepository.deleteById(id);
    }

    // ================= CATEGORY =================

    public String getCategory(String vendorName) {
        return vendorCategoryRepository
                .findByVendorNameIgnoreCase(vendorName)
                .map(VendorCategoryMapping::getCategory)
                .orElse("Others");
    }

    public boolean isAnomaly(String category, BigDecimal amount) {

        BigDecimal avg = expenseRepository.getAverageByCategory(category);
        if (avg == null) return false;

        return amount.compareTo(avg.multiply(BigDecimal.valueOf(3))) > 0;
    }

    // ================= CSV UPLOAD =================

    public void saveExpensesFromCSV(MultipartFile file) {

        User currentUser = getCurrentUser();

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("CSV file is empty");
        }

        List<Expense> expenses = new ArrayList<>();

        try (
                Reader reader = new InputStreamReader(
                        new BOMInputStream(file.getInputStream()),
                        StandardCharsets.UTF_8
                );

                CSVParser csvParser = new CSVParser(
                        reader,
                        CSVFormat.DEFAULT
                                .builder()
                                .setDelimiter(',')
                                .setHeader()
                                .setSkipHeaderRecord(true)
                                .setIgnoreHeaderCase(true)
                                .setTrim(true)
                                .build()
                );

        ) {

            System.out.println("Detected Headers: " + csvParser.getHeaderMap().keySet());

            for (CSVRecord record : csvParser) {

                try {

                    LocalDate date = LocalDate.parse(record.get("expenseDate"));
                    BigDecimal amount = new BigDecimal(record.get("amount"));
                    String vendorName = record.get("vendorName");
                    String description = record.get("description");

                    String category = getCategory(vendorName);

                    Expense expense = Expense.builder()
                            .expenseDate(date)
                            .amount(amount)
                            .vendorName(vendorName)
                            .description(description)
                            .category(category)
                            .isAnomaly(isAnomaly(category, amount))
                            .user(currentUser)
                            .build();

                    expenses.add(expense);

                } catch (Exception rowError) {
                    System.out.println("Skipping row: " + rowError.getMessage());
                }
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse CSV file: " + e.getMessage());
        }

        if (expenses.isEmpty()) {
            System.out.println("No valid records found in CSV.");
            return;
        }

        expenseRepository.saveAll(expenses);

        System.out.println("Successfully saved " + expenses.size() + " expenses.");
    }


    // ================= AUTH =================

    private User getCurrentUser() {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("User not authenticated");
        }

        String email = auth.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
