update storage.buckets
set file_size_limit=262144000,
    allowed_mime_types=array[
      'image/jpeg','image/png','image/webp','image/gif',
      'video/mp4','video/webm','video/quicktime',
      'audio/mpeg','audio/mp4','audio/ogg','audio/wav','audio/webm',
      'application/pdf'
    ]
where id in ('pecatho-private','fans-private');
