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
        // 1. Indian Data Faker
        $faker = Faker::create('en_IN'); 

        DB::beginTransaction();

        try {
            // ==========================================
            // 1. SETUP ADMIN & ROLE
            // ==========================================
            $role = Role::firstOrCreate(['id' => 1], [
                'role_name' => 'Super Admin',
                'permissions' => ['all' => true], // Full access
                'status' => 1, 'is_deleted' => 0, 'user_id' => 0
            ]);

            $user = User::firstOrCreate(['email' => 'admin@gmail.com'], [
                'name' => 'System Admin',
                'password' => Hash::make('admin@1234'),
                'role_id' => $role->id,
                'status' => 1, 'is_deleted' => 0
            ]);

            $this->command->info('Admin Created: admin@gmail.com / admin@1234');

            // ==========================================
            // 2. CREATE 20 INDIAN CUSTOMERS
            // ==========================================
            $customers = [];
            $types = ['SELLER', 'BUYER', 'BOTH'];

            for ($i = 0; $i < 20; $i++) {
                $customers[] = Customer::create([
                    'name' => $faker->name, // Generates: Rajesh Kumar, Priya Singh, etc.
                    'phone' => '9' . $faker->numerify('#########'), // Indian Mobile Format
                    'email' => $faker->unique()->safeEmail,
                    'address' => $faker->address, // Generates: Sector 14, Gurgaon, etc.
                    'type' => $types[array_rand($types)],
                    'created_by' => $user->id,
                    'is_deleted' => 0
                ]);
            }
            $this->command->info('20 Indian Customers Created.');

            // ==========================================
            // 3. CREATE PROPERTIES (Detailed Indian Context)
            // ==========================================
            
            $categories = ['LAND', 'FLAT', 'HOUSE', 'COMMERCIAL', 'AGRICULTURE'];
            $txnTypes = ['PURCHASE', 'SELL'];

            for ($i = 0; $i < 25; $i++) {
                
                $cat = $categories[array_rand($categories)];
                $txnType = $txnTypes[array_rand($txnTypes)];
                $randomCustomer = $customers[array_rand($customers)];

                // --- A. CATEGORY SPECIFIC DATA ---
                $areaDismil = null;
                $plotNo = null;
                $khataNo = null;
                $houseNo = null;
                $floorNo = null;
                $bhk = null;
                $superArea = null;

                if ($cat == 'LAND' || $cat == 'AGRICULTURE') {
                    $areaDismil = $faker->randomFloat(2, 2, 50); // e.g., 5.50 Dismil
                    $plotNo = 'P-' . $faker->numberBetween(100, 999);
                    $khataNo = 'K-' . $faker->numberBetween(10, 99) . '/B';
                } 
                elseif ($cat == 'FLAT') {
                    $floorNo = $faker->numberBetween(1, 15);
                    $bhk = $faker->randomElement([2, 3, 4]);
                    $superArea = $bhk * 450; // Approx sqft
                    $houseNo = $floorNo . '0' . $faker->randomDigitNotNull;
                }
                elseif ($cat == 'HOUSE' || $cat == 'COMMERCIAL') {
                    $houseNo = $faker->numberBetween(1, 200);
                    $superArea = $faker->numberBetween(1000, 5000);
                    $plotNo = 'Sec-' . $faker->numberBetween(1, 50);
                }

                // --- B. FINANCIALS ---
                $qty = 1;
                // Rate: 5 Lakh to 1 Crore
                $rate = $faker->numberBetween(5, 100) * 100000; 
                $baseAmount = $qty * $rate;
                $gstPercent = ($cat == 'LAND') ? 0 : 5; // Land pe 0, baaki pe 5%
                $gstAmount = ($baseAmount * $gstPercent) / 100;
                $otherExpenses = $faker->numberBetween(10, 100) * 1000; // Registry etc.
                $totalAmount = $baseAmount + $gstAmount + $otherExpenses;

                // --- C. SELLER vs BUYER LOGIC ---
                $sellerId = null;
                $buyerId = null;

                if ($txnType == 'PURCHASE') {
                    $sellerId = $randomCustomer->id;
                    $titlePrefix = "Purchased from " . explode(' ', $randomCustomer->name)[0];
                } else {
                    $buyerId = $randomCustomer->id;
                    $titlePrefix = "Sold to " . explode(' ', $randomCustomer->name)[0];
                }

                // Create Property
                $property = Property::create([
                    'date' => $faker->dateTimeBetween('-1 year', 'now'),
                    'transaction_type' => $txnType,
                    'seller_id' => $sellerId,
                    'buyer_id' => $buyerId,
                    'invoice_no' => 'INV-' . strtoupper(substr($txnType, 0, 1)) . rand(1000, 9999),
                    'title' => "$titlePrefix - $cat in " . $faker->city,
                    'category' => $cat,
                    'address' => $faker->streetAddress . ', ' . $faker->city,
                    'quantity' => $qty,
                    'rate' => $rate,
                    'base_amount' => $baseAmount,
                    'gst_percentage' => $gstPercent,
                    'gst_amount' => $gstAmount,
                    'other_expenses' => $otherExpenses,
                    'total_amount' => $totalAmount,
                    
                    // Specific Details
                    'area_dismil' => $areaDismil,
                    'plot_number' => $plotNo,
                    'khata_number' => $khataNo,
                    'house_number' => $houseNo,
                    'floor_number' => $floorNo,
                    'bhk' => $bhk,
                    'super_built_up_area' => $superArea,
                    
                    'paid_amount' => 0, // Update niche karenge
                    'due_amount' => $totalAmount,
                    'status' => 'AVAILABLE',
                    'is_deleted' => 0
                ]);

                // --- 4. TRANSACTIONS (Booking + EMIs) ---
                $paidSoFar = 0;
                
                // 1. Initial Booking (Almost always happens)
                $bookingAmt = $faker->randomFloat(2, 50000, 200000);
                if ($bookingAmt > $totalAmount) $bookingAmt = $totalAmount;

                Transaction::create([
                    'property_id' => $property->id,
                    'amount' => $bookingAmt,
                    'payment_date' => $property->date,
                    'payment_mode' => $faker->randomElement(['CASH', 'UPI', 'NEFT']),
                    'reference_no' => $faker->regexify('[A-Z]{4}00[0-9]{6}'),
                    'remarks' => 'Token Money / Booking',
                    'is_deleted' => 0
                ]);
                $paidSoFar += $bookingAmt;

                // 2. Random 2nd Payment (Some properties are partially paid)
                if ($faker->boolean(70)) { // 70% chance of 2nd payment
                    $emiAmt = $faker->randomFloat(2, 100000, 500000);
                    // Ensure we don't overpay
                    if (($paidSoFar + $emiAmt) <= $totalAmount) {
                         Transaction::create([
                            'property_id' => $property->id,
                            'amount' => $emiAmt,
                            'payment_date' => $faker->dateTimeBetween($property->date, 'now'),
                            'payment_mode' => 'CHEQUE',
                            'reference_no' => 'CHQ-' . $faker->numberBetween(100000, 999999),
                            'remarks' => 'First Installment',
                            'is_deleted' => 0
                        ]);
                        $paidSoFar += $emiAmt;
                    }
                }

                // If fully paid, mark status
                if ($paidSoFar >= $totalAmount - 100) { // Small buffer
                    $property->status = ($txnType == 'SELL') ? 'SOLD' : 'AVAILABLE';
                }
                
                // Update final totals
                $property->update([
                    'paid_amount' => $paidSoFar,
                    'due_amount' => $totalAmount - $paidSoFar,
                    'status' => $property->status // Save updated status
                ]);

                // --- 5. DOCUMENTS (Indian Context) ---
                $docTypes = ['Registry Paper', '7/12 Extract', 'Aadhar Copy', 'Pan Card', 'Sale Deed'];
                $docName = $faker->randomElement($docTypes);

                PropertyDocument::create([
                    'property_id' => $property->id,
                    'doc_name' => $docName,
                    'doc_file' => 'documents/sample.pdf',
                    'is_deleted' => 0
                ]);
            }

            $this->command->info('25 Detailed Indian Properties & Transactions Created!');
            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Error: ' . $e->getMessage());
        }
    }
}