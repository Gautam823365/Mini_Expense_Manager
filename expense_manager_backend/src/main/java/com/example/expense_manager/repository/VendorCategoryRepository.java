package com.example.expense_manager.repository;

import com.example.expense_manager.entity.VendorCategoryMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VendorCategoryRepository extends JpaRepository<VendorCategoryMapping, Long> {

    Optional<VendorCategoryMapping> findByVendorNameIgnoreCase(String vendorName);
}
