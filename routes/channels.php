<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('room.default', function ($user) {
    return [
        'id' => $user->id, 
        'name' => 'Ghost',
        'joined_at' => round(microtime(true) * 1000) // Timestamp dalam ms
    ];
});
