#Requires -Version 5.1
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$AppPath,
    [string]$ExpectedVersion,
    [string]$ExpectedExeSha256,
    [string]$BackupRoot,
    [string]$DistPath = (Join-Path (Split-Path $PSScriptRoot -Parent) 'dist'),
    [switch]$DryRun
)

function Assert-LocalizationPlainPath([string]$Path) {
    $cursor = [IO.Path]::GetFullPath($Path)
    while ($cursor) {
        if (Test-Path -LiteralPath $cursor) {
            $item = Get-Item -LiteralPath $cursor -Force -ErrorAction Stop
            if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
                throw "Reparse points are not supported: $cursor"
            }
        }
        $parent = Split-Path $cursor -Parent
        if ($parent -eq $cursor) { break }
        $cursor = $parent
    }
}

function Get-LocalizationVersion([string]$Exe) {
    return (Get-Item -LiteralPath $Exe -ErrorAction Stop).VersionInfo.FileVersion
}

function Assert-LocalizationStopped([string]$Root) {
    # Read-only inventory. Never stop or signal a process. Failure to inventory is fatal.
    $processes = @(Get-CimInstance -ClassName Win32_Process -ErrorAction Stop)
    foreach ($process in $processes) {
        $path = [string]$process.ExecutablePath
        if ($path -and $path.StartsWith($Root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
            throw "Application is running (PID $($process.ProcessId)). Close it manually."
        }
        if (-not $path -and $process.Name -match '^(claude|anthropic).*\.exe$') {
            throw "Cannot identify application process (PID $($process.ProcessId)); refusing installation."
        }
    }
}

function Get-LocalizationHash([string]$Path) {
    if (Test-Path -LiteralPath $Path -PathType Leaf) {
        return (Get-FileHash -LiteralPath $Path -Algorithm SHA256 -ErrorAction Stop).Hash
    }
    return $null
}

function Move-LocalizationFile([string]$Source, [string]$Target) {
    if ([IO.File]::Exists($Target)) {
        [IO.File]::Replace($Source, $Target, ($Source + '.replaced'))
    } else {
        [IO.File]::Move($Source, $Target)
    }
}

function Install-Localization {
    [CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
    param(
        [Parameter(Mandatory = $true)][string]$AppPath,
        [Parameter(Mandatory = $true)][string]$ExpectedVersion,
        [Parameter(Mandatory = $true)][ValidatePattern('^[a-fA-F0-9]{64}$')][string]$ExpectedExeSha256,
        [Parameter(Mandatory = $true)][string]$BackupRoot,
        [string]$DistPath = (Join-Path (Split-Path $PSScriptRoot -Parent) 'dist'),
        [switch]$DryRun
    )
    $ErrorActionPreference = 'Stop'
    $root = [IO.Path]::GetFullPath($AppPath).TrimEnd('\', '/')
    $dist = [IO.Path]::GetFullPath($DistPath)
    $backup = [IO.Path]::GetFullPath($BackupRoot).TrimEnd('\', '/')
    foreach ($p in @($root, $dist, $backup)) { Assert-LocalizationPlainPath $p }
    if ($root -match '(?i)[\\/]WindowsApps([\\/]|$)') { throw 'Signed WindowsApps packages must not be modified.' }
    if ($backup -eq $root -or $backup.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'BackupRoot must be outside the application directory.'
    }
    if ($dist.TrimEnd('\','/') -eq $root -or $dist.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'DistPath must be outside the application.' }
    if ($backup -eq $dist.TrimEnd('\','/') -or $backup.StartsWith($dist.TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'BackupRoot must be outside DistPath.' }
    if ([IO.Path]::GetPathRoot($backup) -ne [IO.Path]::GetPathRoot($root)) { throw 'BackupRoot must be on the same volume as the application.' }
    $exe = Join-Path $root 'claude.exe'
    Assert-LocalizationPlainPath $exe
    $version = Get-LocalizationVersion $exe
    $exeHash = Get-LocalizationHash $exe
    if ($version -ne $ExpectedVersion -or $exeHash -ne $ExpectedExeSha256) {
        throw "Application version/hash mismatch. Actual version: $version; SHA256: $exeHash"
    }
    Assert-LocalizationStopped $root
    $ion = Join-Path $root 'resources/ion-dist'
    $specs = @(
        @('i18n-ru.js', 'resources/ion-dist/i18n-ru.js'),
        @('en-US.json', 'resources/ion-dist/i18n/en-US.json'),
        @('dynamic/en-US.json', 'resources/ion-dist/i18n/dynamic/en-US.json'),
        @('native-en-US.json', 'resources/en-US.json')
    )
    $entries = @()
    foreach ($spec in $specs) {
        $source = Join-Path $dist $spec[0]
        $target = Join-Path $root $spec[1]
        Assert-LocalizationPlainPath $source
        Assert-LocalizationPlainPath $target
        if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Missing localization resource: $source" }
        if ((Test-Path -LiteralPath $target) -and -not (Test-Path -LiteralPath $target -PathType Leaf)) { throw "Not a file: $target" }
        if ($source.EndsWith('.json')) { $null = [IO.File]::ReadAllText($source) | ConvertFrom-Json }
        $entries += [pscustomobject]@{ Target=$target; Source=$source; Before=(Get-LocalizationHash $target); After=(Get-LocalizationHash $source); Bytes=[IO.File]::ReadAllBytes($source) }
    }
    $htmlPath = Join-Path $ion 'index.html'
    Assert-LocalizationPlainPath $htmlPath
    $htmlBytes = [IO.File]::ReadAllBytes($htmlPath)
    $utf8 = New-Object Text.UTF8Encoding($false, $true)
    $html = $utf8.GetString($htmlBytes)
    $tag = '<script src="/i18n-ru.js"></script>'
    if ($html.Contains('i18n-ru.js') -and -not $html.Contains($tag)) { throw 'Unrecognized existing localization injection.' }
    if (-not $html.Contains($tag)) {
        $heads = [regex]::Matches($html, '(?i)<head(?:\s[^>]*)?>')
        if ($heads.Count -ne 1) { throw 'Expected exactly one HTML head element.' }
        $html = $html.Insert($heads[0].Index + $heads[0].Length, $tag)
    }
    $newHtmlBytes = $utf8.GetBytes($html)
    $sha = [Security.Cryptography.SHA256]::Create()
    try { $htmlHash = ([BitConverter]::ToString($sha.ComputeHash($newHtmlBytes))).Replace('-', '') } finally { $sha.Dispose() }
    $entries += [pscustomobject]@{Target=$htmlPath; Source=$null; Before=(Get-LocalizationHash $htmlPath); After=$htmlHash; Bytes=$newHtmlBytes}
    $plan = [pscustomobject]@{
        Status='Planned'; AppPath=$root; Version=$version; ExeSha256=$exeHash; BackupPath=$null
        Files=@($entries | Select-Object Target, Source, Before, After)
    }
    # No write probes, mkdir, staging, logs or backup creation before this gate.
    if ($DryRun -or -not $PSCmdlet.ShouldProcess($root, 'Install localization resources with transactional backup')) { return $plan }
    Assert-LocalizationStopped $root
    $transaction = Join-Path $backup ('localization-' + [guid]::NewGuid().ToString('N'))
    $createdDirs = New-Object 'System.Collections.Generic.List[string]'
    $attempted = New-Object 'System.Collections.Generic.List[int]'
    $plan.BackupPath = $transaction
    [IO.Directory]::CreateDirectory($transaction) | Out-Null
    $manifest = Join-Path $transaction 'manifest.json'
    try {
        for ($i=0; $i -lt $entries.Count; $i++) {
            $entry=$entries[$i]
            if ((Get-LocalizationHash $entry.Target) -ne $entry.Before) { throw "Target changed since planning: $($entry.Target)" }
            if ($entry.Before) {
                [IO.File]::Copy($entry.Target, (Join-Path $transaction "$i.original"))
                if ((Get-LocalizationHash (Join-Path $transaction "$i.original")) -ne $entry.Before) { throw 'Backup verification failed.' }
            }
            [IO.File]::WriteAllBytes((Join-Path $transaction "$i.staged"), $entry.Bytes)
            if ((Get-LocalizationHash (Join-Path $transaction "$i.staged")) -ne $entry.After) { throw 'Stage verification failed.' }
        }
        $plan.Status='Prepared'
        [IO.File]::WriteAllText($manifest, ($plan | ConvertTo-Json -Depth 6), $utf8)
        Assert-LocalizationStopped $root
        if ((Get-LocalizationVersion $exe) -ne $version -or (Get-LocalizationHash $exe) -ne $exeHash) { throw 'Application changed during preparation.' }
        for ($i=0; $i -lt $entries.Count; $i++) {
            $entry=$entries[$i]
            Assert-LocalizationStopped $root
            Assert-LocalizationPlainPath $entry.Target
            if ((Get-LocalizationHash $entry.Target) -ne $entry.Before) { throw "Target changed during transaction: $($entry.Target)" }
            $parent = Split-Path $entry.Target -Parent
            $missing = @()
            $cursor = $parent
            while (-not [IO.Directory]::Exists($cursor)) { $missing += $cursor; $cursor=Split-Path $cursor -Parent }
            for ($j=$missing.Count-1; $j -ge 0; $j--) { [IO.Directory]::CreateDirectory($missing[$j]) | Out-Null; $createdDirs.Add($missing[$j]) }
            $attempted.Add($i)
            Move-LocalizationFile (Join-Path $transaction "$i.staged") $entry.Target
            if ((Get-LocalizationHash $entry.Target) -ne $entry.After) { throw 'Installed resource verification failed.' }
        }
        $plan.Status='Installed'
        [IO.File]::WriteAllText($manifest, ($plan | ConvertTo-Json -Depth 6), $utf8)
        return $plan
    } catch {
        $failure = $_
        $rollbackErrors = @()
        for ($j=$attempted.Count-1; $j -ge 0; $j--) {
            $i=$attempted[$j]; $entry=$entries[$i]
            try {
                if ($entry.Before) { [IO.File]::Copy((Join-Path $transaction "$i.original"), $entry.Target, $true) }
                elseif ([IO.File]::Exists($entry.Target)) { [IO.File]::Delete($entry.Target) }
                if ((Get-LocalizationHash $entry.Target) -ne $entry.Before) { throw 'Restored hash mismatch.' }
            } catch { $rollbackErrors += "$($entry.Target): $_" }
        }
        for ($j=$createdDirs.Count-1; $j -ge 0; $j--) {
            try { [IO.Directory]::Delete($createdDirs[$j], $false) } catch { $rollbackErrors += "Directory rollback: $_" }
        }
        $plan.Status = if ($rollbackErrors.Count) { 'RollbackFailed' } else { 'RolledBack' }
        try { [IO.File]::WriteAllText($manifest, ($plan | ConvertTo-Json -Depth 6), $utf8) } catch { $rollbackErrors += "Manifest: $_" }
        throw "Installation failed: $failure; status=$($plan.Status); backup=$transaction; rollback errors: $($rollbackErrors -join '; ')"
    }
}

function Restore-Localization {
    [CmdletBinding(SupportsShouldProcess = $true)]
    param([Parameter(Mandatory=$true)][string]$BackupPath, [switch]$DryRun)
    $ErrorActionPreference = 'Stop'
    $backup = [IO.Path]::GetFullPath($BackupPath)
    Assert-LocalizationPlainPath $backup
    $manifestPath = Join-Path $backup 'manifest.json'
    Assert-LocalizationPlainPath $manifestPath
    $manifest = [IO.File]::ReadAllText($manifestPath) | ConvertFrom-Json
    if ($manifest.Status -ne 'Installed') { throw 'Manual restore requires an Installed manifest.' }
    $root = [IO.Path]::GetFullPath([string]$manifest.AppPath).TrimEnd('\','/')
    Assert-LocalizationPlainPath $root
    if ($root -match '(?i)[\\/]WindowsApps([\\/]|$)') { throw 'WindowsApps restore is not supported.' }
    $exe = Join-Path $root 'claude.exe'
    Assert-LocalizationPlainPath $exe
    if ((Get-LocalizationVersion $exe) -ne $manifest.Version -or (Get-LocalizationHash $exe) -ne $manifest.ExeSha256) {
        throw 'Application changed since installation; refusing restore.'
    }
    Assert-LocalizationStopped $root
    $allowed = @('resources/ion-dist/i18n-ru.js','resources/ion-dist/i18n/en-US.json','resources/ion-dist/i18n/dynamic/en-US.json','resources/en-US.json','resources/ion-dist/index.html')
    if (@($manifest.Files).Count -ne $allowed.Count) { throw 'Invalid restore manifest file count.' }
    $entries = @()
    for ($i=0; $i -lt $allowed.Count; $i++) {
        $target = Join-Path $root $allowed[$i]
        $file = $manifest.Files[$i]
        if ([IO.Path]::GetFullPath([string]$file.Target) -ne [IO.Path]::GetFullPath($target)) { throw 'Invalid restore target.' }
        Assert-LocalizationPlainPath $target
        if ((Get-LocalizationHash $target) -ne $file.After) { throw "Installed file changed; refusing restore: $target" }
        $original = $null
        if ($file.Before) {
            $originalPath = Join-Path $backup "$i.original"
            Assert-LocalizationPlainPath $originalPath
            if ((Get-LocalizationHash $originalPath) -ne $file.Before) { throw 'Original backup hash mismatch.' }
            $original = [IO.File]::ReadAllBytes($originalPath)
        }
        $entries += [pscustomobject]@{Target=$target; Before=$file.Before; After=$file.After; Original=$original; Current=[IO.File]::ReadAllBytes($target)}
    }
    if ($DryRun -or -not $PSCmdlet.ShouldProcess($root, 'Restore original localization resources from verified backup')) {
        return [pscustomobject]@{Status='RestorePlanned'; AppPath=$root; BackupPath=$backup}
    }
    $attempted = New-Object 'System.Collections.Generic.List[int]'
    try {
        for ($i=0; $i -lt $entries.Count; $i++) {
            $entry=$entries[$i]
            Assert-LocalizationStopped $root
            Assert-LocalizationPlainPath $entry.Target
            if ((Get-LocalizationHash $entry.Target) -ne $entry.After) { throw 'Target changed during restore.' }
            $attempted.Add($i)
            if ($entry.Before) { [IO.File]::WriteAllBytes($entry.Target, $entry.Original) }
            else { [IO.File]::Delete($entry.Target) }
            if ((Get-LocalizationHash $entry.Target) -ne $entry.Before) { throw 'Restore verification failed.' }
        }
        return [pscustomobject]@{Status='Restored'; AppPath=$root; BackupPath=$backup}
    } catch {
        $failure=$_; $errors=@()
        for ($j=$attempted.Count-1; $j -ge 0; $j--) {
            $entry=$entries[$attempted[$j]]
            try {
                [IO.File]::WriteAllBytes($entry.Target, $entry.Current)
                if ((Get-LocalizationHash $entry.Target) -ne $entry.After) { throw 'Compensation hash mismatch.' }
            } catch { $errors += "$($entry.Target): $_" }
        }
        throw "Restore failed: $failure; compensation errors: $($errors -join '; '); backup=$backup"
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    foreach ($name in @('AppPath','ExpectedVersion','ExpectedExeSha256','BackupRoot')) {
        if (-not (Get-Variable -Name $name -ValueOnly)) { throw "Required parameter: -$name" }
    }
    Install-Localization @PSBoundParameters
}
