<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'arq.john@conobras.com'],
            [
                'name' => 'Arq. John Fabio Giraldo',
                'password' => Hash::make('conobras2026'),
                'phone' => '3128710555',
                'role' => 'Arquitecto Titular & Constructor',
                'company' => 'Conobras Construcción + Arquitectura',
                'avatar' => '',
            ]
        );
    }
}

