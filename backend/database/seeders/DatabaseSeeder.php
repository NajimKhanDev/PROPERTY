<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Customer;
use App\Models\Property;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // Transaction use kar rahe hain taaki data consistency rahe
        DB::beginTransaction();

        try {
            // ==========================================
            // 1. CREATE ROLE (Super Admin)
            // ==========================================
            // ID 1 ko hum Super Admin maan rahe hain
            $role = Role::firstOrCreate(
                ['id' => 1], // Check id 1
                [
                    'role_name' => 'Super Admin',
                    'status' => 1,
                    'is_deleted' => 0,
                    'user_id' => 0 // System generated
                ]
            );

            // ==========================================
            // 2. CREATE USER (Admin)
            // ==========================================
            $user = User::firstOrCreate(
                ['email' => 'admin@gmail.com'], // Check email
                [
                    'name' => 'System Admin',
                    'password' => Hash::make('admin@1234'), // Password: admin@1234
                    'role_id' => $role->id,
                    'status' => 1,
                    'is_deleted' => 0
                ]
            );

            // ==========================================
            // 3. CREATE CUSTOMERS (Seller, Buyer, Both)
            // ==========================================
            
            // Customer 1: SELLER (Jisse hum Zameen khareedenge)
            $seller = Customer::create([
                'name' => 'Ramesh Kumar (Land Owner)',
                'phone' => '9876543210',
                'email' => 'ramesh@example.com',
                'address' => 'Village Palasia, Indore',
                'type' => 'SELLER',
                'created_by' => $user->id,
                'is_deleted' => 0
            ]);

            // Customer 2: BUYER (Jisko hum Flat bechenge)
            $buyer = Customer::create([
                'name' => 'Amit Sharma (Flat Buyer)',
                'phone' => '9123456789',
                'email' => 'amit@example.com',
                'address' => 'Scheme 54, Vijay Nagar',
                'type' => 'BUYER',
                'created_by' => $user->id,
                'is_deleted' => 0
            ]);

            // Customer 3: BOTH (Vyapari - Kabhi leta hai kabhi deta hai)
            $broker = Customer::create([
                'name' => 'Vijay Traders (Broker)',
                'phone' => '8888899999',
                'email' => 'vijay@traders.com',
                'address' => 'M.G. Road, Main Market',
                'type' => 'BOTH',
                'created_by' => $user->id,
                'is_deleted' => 0
            ]);

            // ==========================================
            // 4. CREATE PROPERTIES (Transactions)
            // ==========================================

            // Property 1: PURCHASE (Land purchase from Ramesh)
            // Math: 1 Plot * 10,00,000 = 10L. Expense: 50k. Total: 10.5L. Paid: 5L. Due: 5.5L
            Property::create([
                'date' => now(),
                'transaction_type' => 'PURCHASE',
                'customer_id' => $seller->id, // Linked to Seller
                'invoice_no' => 'INV-PUR-001',
                'title' => 'Agricultural Land Purchase',
                'category' => 'LAND',
                'address' => 'Survey No 52, Palasia',
                'quantity' => 1,
                'rate' => 1000000,
                'base_amount' => 1000000,
                'gst_percentage' => 0, // Land pe GST nahi hota usually
                'gst_amount' => 0,
                'other_expenses' => 50000, // Registry charges etc
                'total_amount' => 1050000,
                'paid_amount' => 500000,
                'due_amount' => 550000,
                'area_dismil' => 5.5,
                'khata_number' => 'K-123',
                'status' => 'AVAILABLE', // Abhi hamare paas hai
                'is_deleted' => 0
            ]);

            // Property 2: SELL (Flat sale to Amit)
            // Math: 1 Flat * 25L. GST 5% (1.25L). Total: 26.25L. Paid: Full.
            Property::create([
                'date' => now(),
                'transaction_type' => 'SELL',
                'customer_id' => $buyer->id, // Linked to Buyer
                'invoice_no' => 'INV-SELL-101',
                'title' => '3BHK Flat Sale',
                'category' => 'FLAT',
                'address' => 'Sky Heights, 4th Floor',
                'quantity' => 1,
                'rate' => 2500000,
                'base_amount' => 2500000,
                'gst_percentage' => 5,
                'gst_amount' => 125000, // 25L ka 5%
                'other_expenses' => 0,
                'total_amount' => 2625000,
                'paid_amount' => 2625000,
                'due_amount' => 0,
                'house_number' => '402',
                'floor_number' => 4,
                'bhk' => 3,
                'status' => 'SOLD',
                'is_deleted' => 0
            ]);

            // Property 3: PURCHASE (Office from Vijay Traders)
            // Math: 1 Shop * 5L. No GST. Paid 0 (Udhaar).
            Property::create([
                'date' => now()->subDays(2),
                'transaction_type' => 'PURCHASE',
                'customer_id' => $broker->id,
                'invoice_no' => 'INV-PUR-002',
                'title' => 'Commercial Shop Purchase',
                'category' => 'COMMERCIAL',
                'address' => 'Shop 10, City Center',
                'quantity' => 1,
                'rate' => 500000,
                'base_amount' => 500000,
                'gst_percentage' => 0,
                'gst_amount' => 0,
                'other_expenses' => 10000,
                'total_amount' => 510000,
                'paid_amount' => 0, // Kuch nahi diya
                'due_amount' => 510000,
                'status' => 'AVAILABLE',
                'is_deleted' => 0
            ]);

            DB::commit();
            $this->command->info('Database seeded successfully! User: admin@gmail.com / admin@1234');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Seeding failed: ' . $e->getMessage());
        }
    }
}