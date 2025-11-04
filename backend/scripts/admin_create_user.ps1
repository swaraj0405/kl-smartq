$baseUrl = "http://localhost:8083/api"

$loginPayload = @{ 
    email = "paramjitbaral44@gmail.com"
    password = "Swaraj@0405"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginPayload
$token = $loginResponse.token
Write-Output "Obtained admin token"

$newUserPayload = @{ 
    name = "Test Staff"
    email = "staff1@example.com"
    password = "Staff@1234"
    role = "STAFF"
} | ConvertTo-Json

$headers = @{ Authorization = "Bearer $token" }

try {
    $createResponse = Invoke-WebRequest -Uri "$baseUrl/admin/users" -Method Post -ContentType "application/json" -Headers $headers -Body $newUserPayload -ErrorAction Stop
    Write-Output "Create response: $($createResponse.Content)"
} catch {
    if ($_.Exception.Response -ne $null) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        $reader.Close()
        Write-Output "Create error: $content"
    } else {
        Write-Output $_
    }
}
