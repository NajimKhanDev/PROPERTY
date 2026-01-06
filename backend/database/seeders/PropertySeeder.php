<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Property;
use Illuminate\Support\Facades\DB;

class PropertySeeder extends Seeder
{
    public function run()
    {
        // Pehle purana data saaf kar dete hain (Optional)
        // DB::table('properties')->truncate();

        $data = [
            // 1. PURCHASE: Zameen kharidi (No GST)
            [
                'date'              => '2025-12-01',
                'transaction_type'  => 'PURCHASE',
                'invoice_no'        => null, // Zameen me bill number nahi hota aksar
                'party_name'        => 'Ramesh Kisan', // Seller
                'party_phone'       => '9876543210',
                'title'             => 'Highway Plot - Khata 55',
                'category'          => 'LAND',
                'address'           => 'Ranchi Ring Road, Near Dhaba',
                
                // Calculation
                'quantity'          => 5, // 5 Dismil
                'rate'              => 200000, // 2 Lakh per dismil
                'base_amount'       => 1000000, // 5 * 2L
                'gst_percentage'    => 0,
                'gst_amount'        => 0,
                'other_expenses'    => 50000, // Registry Cost
                'total_amount'      => 1050000, // 10L + 50k
                
                // Payment
                'paid_amount'       => 500000, // Advance diya
                'due_amount'        => 550000, // Baaki hai
                'is_deleted'        => 0,

                // Specific Fields
                'area_dismil'       => 5.00,
                'plot_number'       => 'P-22',
                'khata_number'      => '55',
                'house_number'      => null,
                'floor_number'      => null,
                'bhk'               => null,
                'super_built_up_area' => null,
                'status'            => 'AVAILABLE',
            ],

            // 2. SELL: Flat Becha (With 5% GST)
            [
                'date'              => '2026-01-02',
                'transaction_type'  => 'SELL',
                'invoice_no'        => 'INV-2026-001',
                'party_name'        => 'Ankit Sharma', // Buyer
                'party_phone'       => '9988776655',
                'title'             => 'Signature Tower - Flat 401',
                'category'          => 'FLAT',
                'address'           => 'Main Road, City Center',
                
                // Calculation
                'quantity'          => 1,
                'rate'              => 4500000, // 45 Lakh
                'base_amount'       => 4500000,
                'gst_percentage'    => 5,
                'gst_amount'        => 225000, // 5% of 45L
                'other_expenses'    => 0,
                'total_amount'      => 4725000, // 45L + 2.25L
                
                // Payment
                'paid_amount'       => 4725000, // Full Payment
                'due_amount'        => 0,
                'is_deleted'        => 0,

                // Specific Fields
                'area_dismil'       => null,
                'plot_number'       => null,
                'khata_number'      => null,
                'house_number'      => '401',
                'floor_number'      => 4,
                'bhk'               => 3,
                'super_built_up_area' => 1250.00,
                'status'            => 'SOLD',
            ],

            // 3. PURCHASE: Construction Material (Cement) - Commercial
            [
                'date'              => '2026-01-04',
                'transaction_type'  => 'PURCHASE',
                'invoice_no'        => 'BILL-998',
                'party_name'        => 'Ultratech Agency',
                'party_phone'       => '8877665544',
                'title'             => 'Cement Bags for Site A',
                'category'          => 'COMMERCIAL',
                'address'           => 'Godown No 5',
                
                // Calculation
                'quantity'          => 100, // Bags
                'rate'              => 420, // Per bag
                'base_amount'       => 42000,
                'gst_percentage'    => 18,
                'gst_amount'        => 7560, // 18% GST
                'other_expenses'    => 500, // Transport logic
                'total_amount'      => 50060, 
                
                // Payment
                'paid_amount'       => 50060,
                'due_amount'        => 0,
                'is_deleted'        => 0,

                'area_dismil'       => null,
                'plot_number'       => null,
                'khata_number'      => null,
                'house_number'      => null,
                'floor_number'      => null,
                'bhk'               => null,
                'super_built_up_area' => null,
                'status'            => 'AVAILABLE',
            ],

            // 4. DELETED ENTRY: Ye check karne ke liye ki Trash me dikh raha hai ya nahi
            [
                'date'              => '2025-11-15',
                'transaction_type'  => 'SELL',
                'invoice_no'        => 'INV-CANCELLED',
                'party_name'        => 'Rahul Wrong Entry',
                'party_phone'       => '0000000000',
                'title'             => 'Mistake Entry Plot',
                'category'          => 'LAND',
                'address'           => 'Unknown',
                
                'quantity'          => 1,
                'rate'              => 100000,
                'base_amount'       => 100000,
                'gst_percentage'    => 0,
                'gst_amount'        => 0,
                'other_expenses'    => 0,
                'total_amount'      => 100000,
                
                'paid_amount'       => 0,
                'due_amount'        => 100000,
                'is_deleted'        => 1, // <--- YE DELETED HAI (Trash me dikhega)

                'area_dismil'       => null,
                'plot_number'       => null,
                'khata_number'      => null,
                'house_number'      => null,
                'floor_number'      => null,
                'bhk'               => null,
                'super_built_up_area' => null,
                'status'            => 'AVAILABLE',
            ],
        ];

        foreach ($data as $item) {
            Property::create($item);
        }
    }
}