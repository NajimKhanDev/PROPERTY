<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // Agar aapko Login karne ke liye ek Dummy User bhi chahiye,
        // to niche wali lines ko uncomment kar dijiye:
        
        // \App\Models\User::factory(10)->create();

        // \App\Models\User::factory()->create([
        //     'name' => 'Admin',
        //     'email' => 'admin@gmail.com',
        //     'password' => bcrypt('password'), // Password: password
        // ]);

        // --- YAHAN HUM APNA PROPERTY SEEDER ADD KARENGE ---
        $this->call([
            PropertySeeder::class,
        ]);
    }
}