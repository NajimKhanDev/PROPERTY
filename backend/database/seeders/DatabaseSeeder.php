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
        $faker = Faker::create();

        DB::beginTransaction();

        try {
            // ==========================================
            // 1. SETUP ADMIN & ROLE
            // ==========================================
            $role = Role::firstOrCreate(['id' => 1], [
                'role_name' => 'Super Admin',
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
            // 2. CREATE 10 CUSTOMERS
            // ==========================================
            $customers = [];
            $types = ['SELLER', 'BUYER', 'BOTH'];

            for ($i = 0; $i < 10; $i++) {
                $customers[] = Customer::create([
                    'name' => $faker->name,
                    'phone' => $faker->numerify('9#########'),
                    'email' => $faker->unique()->safeEmail,
                    'address' => $faker->address,
                    'type' => $types[array_rand($types)],
                    'created_by' => $user->id,
                    'is_deleted' => 0
                ]);
            }
            $this->command->info('10 Customers Created.');

            // ==========================================
            // 3. CREATE PROPERTIES & TRANSACTIONS
            // ==========================================
            
            // Logic: Mix of Purchase (Kharcha) and Sell (Kamai)
            // Categories: LAND, FLAT, HOUSE, COMMERCIAL
            
            $categories = ['LAND', 'FLAT', 'HOUSE', 'COMMERCIAL', 'AGRICULTURE'];
            $transactionTypes = ['PURCHASE', 'SELL'];

            for ($i = 0; $i < 15; $i++) {
                
                // Random Selection
                $cat = $categories[array_rand($categories)];
                $txnType = $transactionTypes[array_rand($transactionTypes)];
                $randomCustomer = $customers[array_rand($customers)];

                // Calculation Logic
                $qty = 1;
                // Rate between 5 Lakh to 50 Lakh
                $rate = $faker->numberBetween(5, 50) * 100000; 
                $baseAmount = $qty * $rate;

                // GST (0%, 5%, 12%, 18%)
                $gstPercent = $faker->randomElement([0, 5, 12]);
                $gstAmount = ($baseAmount * $gstPercent) / 100;

                // Expenses (10k to 50k)
                $otherExpenses = $faker->numberBetween(10, 50) * 1000;

                $totalAmount = $baseAmount + $gstAmount + $otherExpenses;

                // Create Property (Initially 0 Paid, we will add via Transaction)
                $property = Property::create([
                    'date' => $faker->dateTimeBetween('-6 months', 'now'), // Pichle 6 mahine ka data
                    'transaction_type' => $txnType,
                    'customer_id' => $randomCustomer->id,
                    'invoice_no' => 'INV-' . strtoupper(substr($txnType, 0, 3)) . '-' . ($i + 100),
                    'title' => "$cat Deal in " . $faker->city,
                    'category' => $cat,
                    'address' => $faker->address,
                    'quantity' => $qty,
                    'rate' => $rate,
                    'base_amount' => $baseAmount,
                    'gst_percentage' => $gstPercent,
                    'gst_amount' => $gstAmount,
                    'other_expenses' => $otherExpenses,
                    'total_amount' => $totalAmount,
                    'paid_amount' => 0, // Will update below
                    'due_amount' => $totalAmount, // Will update below
                    'status' => 'AVAILABLE',
                    'is_deleted' => 0
                ]);

                // --- 4. CREATE TRANSACTIONS (EMIs) ---
                
                // Scenario: Kisi ne pura paisa diya, kisi ne aadha, kisi ne kuch nahi
                $paymentScenario = $faker->randomElement(['FULL', 'PARTIAL', 'BOOKING_ONLY']);
                $transactionsTotal = 0;

                // First Payment (Booking) - Always happens usually
                $bookingAmount = 0;
                if ($paymentScenario == 'FULL') {
                    $bookingAmount = $totalAmount; // Ek baar me pura paisa
                    $property->update(['status' => ($txnType == 'SELL' ? 'SOLD' : 'AVAILABLE')]);
                } elseif ($paymentScenario == 'PARTIAL') {
                    $bookingAmount = $totalAmount * 0.40; // 40% Booking
                } else {
                    $bookingAmount = 50000; // Sirf token money
                }

                // Add 1st Transaction
                if ($bookingAmount > 0) {
                    Transaction::create([
                        'property_id' => $property->id,
                        'amount' => $bookingAmount,
                        'payment_date' => $property->date, // Same as deal date
                        'payment_mode' => $faker->randomElement(['CASH', 'ONLINE', 'CHEQUE']),
                        'reference_no' => $faker->swiftBicNumber,
                        'remarks' => 'Booking / Down Payment',
                        'is_deleted' => 0
                    ]);
                    $transactionsTotal += $bookingAmount;
                }

                // Add 2nd Transaction (Agar partial hai to 1 mahine baad ek aur payment)
                if ($paymentScenario == 'PARTIAL') {
                    $secondInstallment = $totalAmount * 0.20; // 20% aur diya
                    
                    Transaction::create([
                        'property_id' => $property->id,
                        'amount' => $secondInstallment,
                        'payment_date' => $faker->dateTimeBetween($property->date, 'now'),
                        'payment_mode' => 'ONLINE',
                        'remarks' => '2nd Installment',
                        'is_deleted' => 0
                    ]);
                    $transactionsTotal += $secondInstallment;
                }

                // Update Property Paid/Due
                $property->update([
                    'paid_amount' => $transactionsTotal,
                    'due_amount' => $totalAmount - $transactionsTotal
                ]);

                // --- 5. CREATE DOCUMENTS ---
                $docNames = ['Registry Paper', 'Aadhar Card', 'Pan Card', 'Agreement Copy'];
                $randomDoc = $docNames[array_rand($docNames)];

                PropertyDocument::create([
                    'property_id' => $property->id,
                    'doc_name' => $randomDoc,
                    'doc_file' => 'documents/dummy.pdf', // Dummy path
                    'is_deleted' => 0
                ]);
            }

            $this->command->info('15 Properties, Related Transactions & Documents Created!');

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Seeding Error: ' . $e->getMessage());
        }
    }
}