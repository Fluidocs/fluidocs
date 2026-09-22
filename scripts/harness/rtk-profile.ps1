# Loaded from the user's PowerShell profile. Only routes commands inside Fluidocs.
$script:FluidocsRtkRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..')).TrimEnd('\', '/')

function global:rtk {
    $native = Get-Command rtk.exe -CommandType Application -ErrorAction Stop | Select-Object -First 1
    $current = (Get-Location).ProviderPath
    $inside = $current -and ($current.Equals($script:FluidocsRtkRoot, [StringComparison]::OrdinalIgnoreCase) -or
        $current.StartsWith($script:FluidocsRtkRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase))
    if ($inside) {
        & python (Join-Path $script:FluidocsRtkRoot 'scripts/harness/rtk.py') @args
    } else {
        & $native.Source @args
    }
}
