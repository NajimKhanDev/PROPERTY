<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Customer;
use App\Models\Property;
use App\Models\Transaction;
use App\Models\SellProperty; 
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $faker = Faker::create('en_IN'); 

        DB::beginTransaction();

        try {
            // ==========================================
            // 1. SETUP BASE DATA
            // ==========================================
            $role = Role::firstOrCreate(['id' => 1], ['role_name' => 'Super Admin', 'permissions' => ['all' => true], 'status' => 1, 'is_deleted' => 0, 'user_id' => 0]);

            $user = User::firstOrCreate(['email' => 'admin@gmail.com'], [
                'name' => 'System Admin', 'password' => Hash::make('admin@1234'), 'role_id' => $role->id, 'status' => 1, 'is_deleted' => 0
            ]);

            $customers = [];
            for ($i = 0; $i < 30; $i++) {
                $customers[] = Customer::create([
                    'name' => $faker->name,
                    'phone' => '9' . $faker->numerify('#########'),
                    'email' => $faker->unique()->safeEmail,
                    'address' => $faker->address,
                    'type' => 'BOTH',
                    'created_by' => $user->id, 'is_deleted' => 0
                ]);
            }
            $this->command->info('Base data created');

            // ==========================================
            // 2. CREATE INVENTORY & TRANSACTIONS
            // ==========================================
            $categories = ['LAND', 'FLAT', 'HOUSE', 'COMMERCIAL', 'AGRICULTURE'];
            
            // Loop 25 Properties
            for ($i = 0; $i < 25; $i++) {
                
                $isSold = ($i >= 8); // 8 Available, 17 Sold
                $cat = $categories[array_rand($categories)];
                $supplier = $customers[array_rand($customers)];

                // Cost financials
                $costRate = $faker->numberBetween(10, 50) * 100000;
                $totalCost = $costRate + 15000;

                // Create Inventory
                $property = Property::create([
                    'transaction_type' => 'PURCHASE',
                    'date' => $faker->dateTimeBetween('-2 years', '-1 year'),
                    'invoice_no' => 'PUR-' . rand(1000, 9999),
                    'seller_id' => $supplier->id,
                    'title' => "Property $cat - $i",
                    'category' => $cat,
                    'quantity' => 1,
                    'rate' => $costRate,
                    'base_amount' => $costRate,
                    'total_amount' => $totalCost,
                    'paid_amount' => $totalCost, // Fully paid to vendor
                    'due_amount' => 0,
                    'status' => $isSold ? 'SOLD' : 'AVAILABLE',
                    'is_deleted' => 0
                ]);

                // 1. DEBIT TRANSACTION (Purchase Expense)
                Transaction::create([
                    'property_id' => $property->id,
                    'sell_property_id' => null, // Expense has no sale ID
                    'type' => 'DEBIT',          // Money Out
                    'amount' => $totalCost,
                    'payment_date' => $property->date,
                    'payment_mode' => 'CHEQUE',
                    'reference_no' => 'PAY-OUT-' . $i,
                    'remarks' => 'Purchase payment to vendor',
                    'is_deleted' => 0
                ]);

                // ==========================================
                // 3. SALES LOGIC (Generate multiple credits)
                // ==========================================
                if ($isSold) {
                    $buyer = $customers[array_rand($customers)];
                    
                    // Sales financials (20% margin)
                    $salePrice = $totalCost * 1.2;
                    $saleGst = ($cat == 'LAND') ? 0 : ($salePrice * 0.05);
                    $finalSalePrice = $salePrice + $saleGst;

                    // Create Deal
                    $saleDeal = SellProperty::create([
                        'property_id' => $property->id,
                        'customer_id' => $buyer->id,
                        'invoice_no' => 'SALE-' . rand(10000, 99999),
                        'sale_date' => $faker->dateTimeBetween('-11 months', '-6 months'),
                        'sale_rate' => $salePrice,
                        'sale_base_amount' => $salePrice,
                        'gst_amount' => $saleGst,
                        'total_sale_amount' => $finalSalePrice,
                        'received_amount' => 0, // Will update below
                        'pending_amount' => $finalSalePrice,
                        'is_deleted' => 0
                    ]);

                    // Generate Multiple Income Transactions (Installments)
                    $collected = 0;
                    $numInstallments = $faker->numberBetween(2, 4); // 2 to 4 payments per sale

                    for ($k = 1; $k <= $numInstallments; $k++) {
                        // Calculate installment amount
                        $installment = floor($finalSalePrice / $numInstallments);
                        
                        // Adjust last installment
                        if ($k == $numInstallments) {
                            $installment = $finalSalePrice - $collected;
                        }

                        // 2. CREDIT TRANSACTION (Sales Income)
                        Transaction::create([
                            'property_id' => $property->id,
                            'sell_property_id' => $saleDeal->id, // LINKED TO DEAL
                            'type' => 'CREDIT',                  // Money In
                            'amount' => $installment,
                            'payment_date' => $faker->dateTimeBetween($saleDeal->sale_date, 'now'),
                            'payment_mode' => $faker->randomElement(['UPI', 'CHEQUE', 'CASH']),
                            'reference_no' => "REC-$i-$k",
                            'remarks' => "Installment $k received",
                            'is_deleted' => 0
                        ]);

                        $collected += $installment;
                    }

                    // Update Deal Status
                    $saleDeal->update([
                        'received_amount' => $collected,
                        'pending_amount' => 0
                    ]);

                    // Update Inventory Link
                    $property->update([
                        'status' => 'SOLD',
                        'buyer_id' => $buyer->id
                    ]);
                }
            }

            $this->command->info('Seeding Done: 25 Properties & 60+ Transactions Created.');
            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Error: ' . $e->getMessage());
        }
    }
}