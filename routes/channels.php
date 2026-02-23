<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('presence-room.default', function ($user) {
    return [
        'id' => $user->id, 
        'name' => 'Ghost',
        'joined_at' => round(microtime(true) * 1000) // Timestamp dalam ms
    ];
});

Broadcast::channel('private-movement.default', function ($user) {
    return true;
});
