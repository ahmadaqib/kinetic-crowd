<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Mendaftarkan POST /broadcasting/auth (dibutuhkan oleh Echo/Pusher)
Broadcast::routes(['middleware' => ['web']]);

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/room', function () {
    return Inertia::render('room');
})->name('room');
