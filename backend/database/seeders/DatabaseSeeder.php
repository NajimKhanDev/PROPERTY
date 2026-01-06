<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Customer;
use App\Models\Property;
use App\Models\Transaction; // Assuming you still have this for payment history
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

// NOTE: Make sure you have created the SellProperty Model
// If not, create it: php artisan make:model SellProperty
use App\Models\SellProperty; 

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $faker = Faker::create('en_IN'); 

        DB::beginTransaction();

        try {
            // ==========================================
            // 1. SETUP ADMIN & CUSTOMERS
            // ==========================================
            $role = Role::firstOrCreate(['id' => 1], ['role_name' => 'Super Admin', 'permissions' => ['all' => true], 'status' => 1, 'is_deleted' => 0, 'user_id' => 0]);

            $user = User::firstOrCreate(['email' => 'admin@gmail.com'], [
                'name' => 'System Admin', 'password' => Hash::make('admin@1234'), 'role_id' => $role->id, 'status' => 1, 'is_deleted' => 0
            ]);

            $customers = [];
            $types = ['SELLER', 'BUYER', 'BOTH'];
            for ($i = 0; $i < 30; $i++) {
                $customers[] = Customer::create([
                    'name' => $faker->name,
                    'phone' => '9' . $faker->numerify('#########'),
                    'email' => $faker->unique()->safeEmail,
                    'address' => $faker->address,
                    'type' => $types[array_rand($types)],
                    'created_by' => $user->id, 'is_deleted' => 0
                ]);
            }
            $this->command->info('Step 1: Admin & Customers Created.');


            // ==========================================
            // 2. CREATE INVENTORY (PROPERTIES TABLE)
            // ==========================================
            $categories = ['LAND', 'FLAT', 'HOUSE', 'COMMERCIAL', 'AGRICULTURE'];
            
            // Total 25 Properties: 10 Unsold (Available), 15 Sold
            for ($i = 0; $i < 25; $i++) {
                
                $isSold = ($i >= 10); // First 10 Available, Rest Sold
                $cat = $categories[array_rand($categories)];
                $supplier = $customers[array_rand($customers)]; // Purchased from

                // A. Purchase Financials (Cost Price)
                $costRate = $faker->numberBetween(10, 50) * 100000; // 10L - 50L
                $baseCost = $costRate;
                $costGst = ($cat == 'LAND') ? 0 : 5;
                $gstAmt = ($baseCost * $costGst) / 100;
                $totalCost = $baseCost + $gstAmt + 10000;

                // B. Create Property (Inventory)
                $property = Property::create([
                    'transaction_type' => 'PURCHASE', // Always PURCHASE for inventory
                    'date' => $faker->dateTimeBetween('-1 year', '-6 months'),
                    'invoice_no' => 'PUR-' . rand(1000, 9999),
                    'seller_id' => $supplier->id,
                    'buyer_id' => null, // Will update if sold
                    
                    'title' => "Plot at " . $faker->streetName,
                    'category' => $cat,
                    'address' => $faker->address,
                    
                    // Costing
                    'quantity' => 1,
                    'rate' => $costRate,
                    'base_amount' => $baseCost,
                    'gst_percentage' => $costGst,
                    'gst_amount' => $gstAmt,
                    'other_expenses' => 10000,
                    'total_amount' => $totalCost,
                    'paid_amount' => $totalCost, // We paid full to vendor
                    'due_amount' => 0,
                    
                    // Dimensions
                    'area_dismil' => $faker->randomFloat(2, 2, 10),
                    'plot_number' => 'P-' . $i,
                    
                    'status' => $isSold ? 'SOLD' : 'AVAILABLE',
                    'is_deleted' => 0
                ]);

                // ==========================================
                // 3. IF SOLD -> ENTRY IN SELL_PROPERTIES
                // ==========================================
                if ($isSold) {
                    $buyer = $customers[array_rand($customers)];
                    
                    // Sale Financials (Selling Price > Cost Price)
                    $margin = $faker->numberBetween(5, 20); // 5-20% Profit
                    $saleRate = $costRate + ($costRate * $margin / 100);
                    $saleBase = $saleRate;
                    $saleGst = ($cat == 'LAND') ? 0 : 5;
                    $saleGstAmt = ($saleBase * $saleGst) / 100;
                    $otherCharges = 5000;
                    $totalSaleAmt = $saleBase + $saleGstAmt + $otherCharges;

                    // Payment Calculation (Full or Partial)
                    $isFullyPaid = $faker->boolean(70); // 70% chance full payment
                    $received = $isFullyPaid ? $totalSaleAmt : ($totalSaleAmt / 2);
                    $pending = $totalSaleAmt - $received;

                    // Update Parent Property Status & Buyer
                    $property->update([
                        'status' => $isFullyPaid ? 'SOLD' : 'BOOKED',
                        'buyer_id' => $buyer->id // Linking buyer to inventory too
                    ]);

                    // Create Sale Record
                    DB::table('sell_properties')->insert([
                        'property_id' => $property->id,
                        'customer_id' => $buyer->id,
                        'invoice_no' => 'SALE-' . rand(10000, 99999),
                        'sale_date' => $faker->dateTimeBetween('-5 months', 'now'),
                        
                        // Financials
                        'sale_rate' => $saleRate,
                        'sale_base_amount' => $saleBase,
                        'gst_percentage' => $saleGst,
                        'gst_amount' => $saleGstAmt,
                        'other_charges' => $otherCharges,
                        'discount_amount' => 0,
                        'total_sale_amount' => $totalSaleAmt,
                        
                        // Tracking
                        'received_amount' => $received,
                        'pending_amount' => $pending,
                        'remarks' => $isFullyPaid ? 'Deal Closed' : 'Balance Pending',
                        'is_deleted' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Optional: Create Transaction Record (If you have a transactions table)
                    if ($received > 0) {
                        Transaction::create([
                            'property_id' => $property->id, // Linked to Property
                            'amount' => $received,
                            'payment_date' => now(),
                            'payment_mode' => 'CHEQUE',
                            'reference_no' => 'CHQ-SALE-' . $i,
                            'remarks' => 'Payment received for Sale',
                            'is_deleted' => 0
                        ]);
                    }
                }
            }

            $this->command->info('Seeding Done: 10 Available Stock, 15 Sold Properties.');
            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Error: ' . $e->getMessage());
        }
    }
}