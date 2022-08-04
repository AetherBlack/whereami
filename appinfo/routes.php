<?php
return [
    'routes' => [
        ['name' => 'page#index', 'url' => '/', 'verb' => 'GET'],
        ['name' => 'page#quotes', 'url' => '/quotes', 'verb' => 'GET'],
        ['name' => 'page#getLastSeen', 'url' => '/getLastSeen', 'verb' => 'POST'],
        ['name' => 'page#getEvents', 'url' => '/getEvents', 'verb' => 'POST'],
    ]
];
