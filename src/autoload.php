<?php

$autoload = json_decode(file_get_contents('../autoload.json'), 1);

foreach($autoload['files'] as $al) {
    require "../$al";
}

spl_autoload_register(function ($class) use ($autoload) {
    foreach ($autoload as $ns => $loader) {
        if ($class === $ns || strpos($class, $ns.'\\') === 0) {

            $fileSuffix = '';
            if ($class !== $ns) {
                $fileSuffix = DIRECTORY_SEPARATOR . preg_replace('/\\\/', '/', substr($class, strlen($ns) + 1));
            }

            $file = '..'
                . DIRECTORY_SEPARATOR
                . $loader
                . $fileSuffix
                . '.php';

            if (stream_resolve_include_path($file)) {
                require $file;
            }
        }
    }
});
