package com.example.expense_manager.repository;

import com.example.expense_manager.entity.Expense;
import com.example.expense_manager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    @Query("SELECT AVG(e.amount) FROM Expense e WHERE e.category = :category")
    BigDecimal getAverageByCategory(String category);

    long countByIsAnomalyTrue();
    List<Expense> findByUser(User user);

}

