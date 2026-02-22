package com.example.expense_manager.controller;

import com.example.expense_manager.dto.ExpenseRequest;
import com.example.expense_manager.entity.Expense;
import com.example.expense_manager.service.ExpenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public ResponseEntity<?> getAllExpenses() {
        return ResponseEntity.ok(expenseService.getAllExpenses());
    }

    @PostMapping
    public ResponseEntity<?> addExpense(@RequestBody ExpenseRequest request) {

        Expense saved = expenseService.addExpense(request);

        return ResponseEntity.ok(saved);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteExpense(@PathVariable Long id) {

        expenseService.deleteExpense(id);

        return ResponseEntity.ok("Expense Deleted Successfully");
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadCSV(@RequestParam("file") MultipartFile file) {

        expenseService.saveExpensesFromCSV(file);

        return ResponseEntity.ok("CSV uploaded successfully");
    }


}