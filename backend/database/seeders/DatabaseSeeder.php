<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Customer;
use App\Models\Property;
use App\Models\Transaction;
use App\Models\PropertyDocument; 
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // 1. Indian Faker
        $faker = Faker::create('en_IN'); 

        DB::beginTransaction();

        try {
            // ==========================================
            // 1. SETUP ADMIN
            // ==========================================
            $role = Role::firstOrCreate(['id' => 1], [
                'role_name' => 'Super Admin',
                'permissions' => ['all' => true],
                'status' => 1, 'is_deleted' => 0, 'user_id' => 0
            ]);

            $user = User::firstOrCreate(['email' => 'admin@gmail.com'], [
                'name' => 'System Admin',
                'password' => Hash::make('admin@1234'),
                'role_id' => $role->id,
                'status' => 1, 'is_deleted' => 0
            ]);

            $this->command->info('Admin Created: admin@gmail.com');

            // ==========================================
            // 2. CREATE CUSTOMERS
            // ==========================================
            $customers = [];
            $types = ['SELLER', 'BUYER', 'BOTH'];

            for ($i = 0; $i < 30; $i++) {
                $customers[] = Customer::create([
                    'name' => $faker->name,
                    'phone' => '9' . $faker->numerify('#########'),
                    'email' => $faker->unique()->safeEmail,
                    'address' => $faker->address,
                    'type' => $types[array_rand($types)],
                    'created_by' => $user->id,
                    'is_deleted' => 0
                ]);
            }
            $this->command->info('30 Customers Created.');

            // ==========================================
            // 3. CREATE PROPERTIES & TRANSACTIONS
            // ==========================================
            
            $categories = ['LAND', 'FLAT', 'HOUSE', 'COMMERCIAL', 'AGRICULTURE'];

            // Loop 25 times: 10 Purchases (Stock), 15 Sales
            for ($i = 0; $i < 25; $i++) {
                
                // Decide Type: First 10 are PURCHASE (Stock), rest are SELL
                $txnType = ($i < 10) ? 'PURCHASE' : 'SELL';
                
                $cat = $categories[array_rand($categories)];
                $randomCustomer = $customers[array_rand($customers)];

                // --- A. PROPERTY DETAILS ---
                $areaDismil = null; $plotNo = null; $khataNo = null;
                $houseNo = null; $floorNo = null; $bhk = null; $superArea = null;

                if ($cat == 'LAND' || $cat == 'AGRICULTURE') {
                    $areaDismil = $faker->randomFloat(2, 2, 20);
                    $plotNo = 'P-' . $faker->numberBetween(10, 999);
                    $khataNo = 'K-' . $faker->numberBetween(10, 99);
                } 
                elseif ($cat == 'FLAT') {
                    $floorNo = $faker->numberBetween(1, 12);
                    $bhk = $faker->randomElement([2, 3]);
                    $superArea = $bhk * 400; 
                    $houseNo = $floorNo . '0' . $faker->randomDigitNotNull;
                }
                else {
                    $houseNo = $faker->numberBetween(1, 100);
                    $superArea = $faker->numberBetween(800, 3000);
                    $plotNo = 'Sec-' . $faker->numberBetween(1, 20);
                }

                // --- B. FINANCIALS ---
                $rate = $faker->numberBetween(10, 80) * 100000; // 10L - 80L
                $baseAmount = $rate; 
                $gstPercent = ($cat == 'LAND') ? 0 : 5;
                $gstAmount = ($baseAmount * $gstPercent) / 100;
                $otherExpenses = 25000;
                $totalAmount = $baseAmount + $gstAmount + $otherExpenses;

                // --- C. CONTEXT LOGIC ---
                $sellerId = null;
                $buyerId = null;
                $status = 'AVAILABLE';
                $titlePrefix = "";

                if ($txnType == 'PURCHASE') {
                    // We bought it, so it is AVAILABLE stock
                    $sellerId = $randomCustomer->id;
                    $status = 'AVAILABLE'; 
                    $titlePrefix = "Acquired Land";
                } else {
                    // We sold it
                    $buyerId = $randomCustomer->id;
                    $titlePrefix = "Sold to " . explode(' ', $randomCustomer->name)[0];
                    // Status depends on payment (calculated below)
                }

                $property = Property::create([
                    'date' => $faker->dateTimeBetween('-6 months', 'now'),
                    'transaction_type' => $txnType,
                    'seller_id' => $sellerId,
                    'buyer_id' => $buyerId,
                    'invoice_no' => 'INV-' . strtoupper(substr($txnType, 0, 1)) . rand(10000, 99999),
                    'title' => "$titlePrefix - $cat",
                    'category' => $cat,
                    'address' => $faker->streetAddress . ', ' . $faker->city,
                    'quantity' => 1,
                    'rate' => $rate,
                    'base_amount' => $baseAmount,
                    'gst_percentage' => $gstPercent,
                    'gst_amount' => $gstAmount,
                    'other_expenses' => $otherExpenses,
                    'total_amount' => $totalAmount,
                    
                    'area_dismil' => $areaDismil,
                    'plot_number' => $plotNo,
                    'khata_number' => $khataNo,
                    'house_number' => $houseNo,
                    'floor_number' => $floorNo,
                    'bhk' => $bhk,
                    'super_built_up_area' => $superArea,
                    
                    'paid_amount' => 0, 
                    'due_amount' => $totalAmount,
                    'status' => $status,
                    'is_deleted' => 0
                ]);

                // --- D. TRANSACTIONS ---
                $paidSoFar = 0;

                // 1. Initial Payment (Booking / Token)
                $bookingAmt = $faker->randomFloat(2, 50000, 200000);
                if ($bookingAmt > $totalAmount) $bookingAmt = $totalAmount;

                Transaction::create([
                    'property_id' => $property->id,
                    'amount' => $bookingAmt,
                    'payment_date' => $property->date,
                    'payment_mode' => $faker->randomElement(['CASH', 'UPI']),
                    'reference_no' => 'TXN' . $faker->numerify('######'),
                    'remarks' => ($txnType == 'SELL') ? 'Booking Amount Received' : 'Token Paid to Vendor',
                    'is_deleted' => 0
                ]);
                $paidSoFar += $bookingAmt;

                // 2. Installments (Only for Sold properties mainly)
                if ($txnType == 'SELL' && $faker->boolean(80)) {
                    $installments = $faker->numberBetween(1, 3);
                    
                    for($k=0; $k<$installments; $k++) {
                        $emi = $faker->randomFloat(2, 100000, 500000);
                        if (($paidSoFar + $emi) <= $totalAmount) {
                            Transaction::create([
                                'property_id' => $property->id,
                                'amount' => $emi,
                                'payment_date' => $faker->dateTimeBetween($property->date, 'now'),
                                'payment_mode' => 'CHEQUE',
                                'reference_no' => 'CHQ' . $faker->numerify('######'),
                                'remarks' => 'Installment Payment',
                                'is_deleted' => 0
                            ]);
                            $paidSoFar += $emi;
                        }
                    }
                }

                // --- E. UPDATE STATUS ---
                // For SELL: If paid >= total -> SOLD, else BOOKED
                // For PURCHASE: Always AVAILABLE (Inventory)
                
                if ($txnType == 'SELL') {
                    if ($paidSoFar >= ($totalAmount - 100)) {
                        $property->status = 'SOLD';
                    } else {
                        $property->status = 'BOOKED';
                    }
                }

                $property->update([
                    'paid_amount' => $paidSoFar,
                    'due_amount' => $totalAmount - $paidSoFar,
                    'status' => $property->status
                ]);

                // --- F. DOCUMENTS ---
                PropertyDocument::create([
                    'property_id' => $property->id,
                    'doc_name' => 'Agreement Copy',
                    'doc_file' => 'documents/demo.pdf',
                    'is_deleted' => 0
                ]);
            }

            $this->command->info('Seeding Completed: 10 Inventory Items & 15 Sales Records.');
            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Error: ' . $e->getMessage());
        }
    }
}