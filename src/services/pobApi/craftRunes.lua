-- Rune choice for the craft score. Rune data and restriction flags (isSocketBound, limit) come from
-- the installed PoB (data.itemMods.Runes); arevtur keeps no rune data of its own.
-- Builds on PoB flags that exist since PoB v0.22.0; on older PoB no rule is enforced.

local M = {}

local function runeFlag(name, field)
    local rune = name and data.itemMods.Runes[name]
    if not rune then return false end
    for _, slotMod in pairs(rune) do
        if slotMod[field] then return slotMod[field] end
    end
    return false
end

function M.isSocketBound(name) return runeFlag(name, 'isSocketBound') == true end
function M.isLimitOne(name) return runeFlag(name, 'limit') == 1 end

-- tradeRunes: runes PoB detected on the trade item. equippedRunes: runes on the build's equipped item.
-- Returns a new table; neither input is modified.
function M.buildCraftRunes(tradeRunes, equippedRunes, socketCount)
    local runes, placed = {}, {}
    local function add(r)
        if #runes >= socketCount or not r or r == 'None' then return end
        if M.isLimitOne(r) and placed[r] then return end
        table.insert(runes, r)
        placed[r] = true
    end
    -- 1. socket-bound runes on the trade item can't be replaced
    for _, r in ipairs(tradeRunes or {}) do
        if M.isSocketBound(r) then add(r) end
    end
    -- 2. the build's runes, except ones bound to the equipped item
    for _, r in ipairs(equippedRunes or {}) do
        if not M.isSocketBound(r) then add(r) end
    end
    -- 3. fill remaining sockets
    local fill = nil
    for _, r in ipairs(equippedRunes or {}) do
        if r and r ~= 'None' and not M.isLimitOne(r) and not M.isSocketBound(r) then
            fill = r
            break
        end
    end
    while #runes < socketCount do table.insert(runes, fill or 'None') end
    return runes
end

return M
