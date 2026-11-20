-- Step 0 probe. Run: cd <PoB path>; luajit.exe <this file>
package.path = package.path .. ';C:/Users/MDuh/Desktop/Projects/arevtur/arevtur/src/services/pobApi/?.lua;./lua/?.lua;../runtime/lua/?.lua'
require('HeadlessWrapper')

local base
for name, b in pairs(data.itemBases) do
    if b.type == 'Body Armour' and b.socketLimit and b.socketLimit >= 3 then base = name break end
end
print('base', base)

local function parse(label, lines, sockets)
    local text = table.concat({ 'Item Class', base, 'Quality: 0', 'Sockets: ' .. string.rep('S ', sockets), unpack(lines) }, '\n')
    local item = new('Item', text)
    local names = {}
    for _, r in ipairs(item.runes) do names[#names + 1] = r end
    print(label, 'sockets=' .. item.itemSocketCount, 'runes=[' .. table.concat(names, ', ') .. ']', 'runeModLines=' .. #item.runeModLines)
end

-- Medved: "Can roll Soul modifiers" + bonded lines; three Iron runes
for _, fmt in ipairs({ { 'suffix', function(l) return l .. ' (rune)' end }, { 'prefix', function(l) return '{rune}' .. l end }, { 'none', function(l) return l end } }) do
    local f = fmt[2]
    print('--- format', fmt[1])
    parse('medved only', { f('Can roll Soul modifiers') }, 3)
    parse('medved+bonded', { f('Can roll Soul modifiers'), f('Bonded: 3% increased maximum Life'), f('Bonded: 3% increased maximum Mana') }, 3)
    parse('iron x2', { f('+14% to Fire Resistance') }, 2)
end

print('=== debug medved')
local text = table.concat({ 'Item Class', base, 'Quality: 0', 'Sockets: S S S', 'Can roll Soul modifiers (rune)', '+10% to Fire Resistance' }, '\n')
local item = new('Item', text)
print('rune', #item.runeModLines, 'ench', #item.enchantModLines, 'impl', #item.implicitModLines, 'expl', #item.explicitModLines)
for _, t in ipairs({ 'runeModLines', 'enchantModLines', 'implicitModLines', 'explicitModLines' }) do
    for _, m in ipairs(item[t]) do print(t, m.line, 'bonded=' .. tostring(m.bonded)) end
end
print('types', item:GetSocketedAugmentTypes())

print('=== runes after explicit')
local function parse2(label, runeLines, sockets, corrupted)
    local lines = { 'Item Class', base, 'Quality: 0', 'Sockets: ' .. string.rep('S ', sockets), '+10% to Fire Resistance' }
    for _, l in ipairs(runeLines) do lines[#lines + 1] = l .. ' (rune)' end
    if corrupted then lines[#lines + 1] = 'Corrupted' end
    local it = new('Item', table.concat(lines, '\n'))
    print(label, 'runes=[' .. table.concat(it.runes, ', ') .. ']', 'runeModLines=' .. #it.runeModLines, 'explicit=' .. #it.explicitModLines)
end
parse2('medved only', { 'Can roll Soul modifiers' }, 3)
parse2('medved+bonded', { 'Can roll Soul modifiers', 'Bonded: 3% increased maximum Life', 'Bonded: 3% increased maximum Mana' }, 3)
parse2('medved+iron-ish', { 'Can roll Soul modifiers', '+30 to maximum Life' }, 3)
parse2('medved corrupted', { 'Can roll Soul modifiers' }, 3, true)

print('=== Examples table (real craftRunes module)')
package.path = package.path .. ';C:/Users/MDuh/Desktop/Projects/arevtur/arevtur/src/services/pobApi/?.lua'
local cr = require('craftRunes')
-- full flow: parse, NormaliseQuality, BuildAndParseRaw, read runes (as evalEquippingItem does)
local function tradeRunesOf(runeLines, sockets, corrupted)
    local lines = { 'Item Class', base, 'Quality: 0', 'Sockets: ' .. string.rep('S ', sockets), '+10% to Fire Resistance' }
    for _, l in ipairs(runeLines) do lines[#lines + 1] = l .. ' (rune)' end
    if corrupted then lines[#lines + 1] = 'Corrupted' end
    local it = new('Item', table.concat(lines, '\n'))
    it:NormaliseQuality(); it:BuildAndParseRaw()
    return { unpack(it.runes) }
end
local function check(label, got, want)
    local g, w = table.concat(got, ', '), table.concat(want, ', ')
    print((g == w and 'PASS ' or 'FAIL ') .. label .. ': ' .. g .. (g == w and '' or ('   expected: ' .. w)))
end
local function snapshot(t) return table.concat(t, ',') end

local medved = tradeRunesOf({ 'Can roll Soul modifiers' }, 3)
check('1 medved', cr.buildCraftRunes(medved, { 'Greater Iron Rune', 'Greater Iron Rune', 'Greater Iron Rune' }, 3), { "Medved's Tending", 'Greater Iron Rune', 'Greater Iron Rune' })
check('2 none', cr.buildCraftRunes({}, { 'Greater Iron Rune', 'Greater Iron Rune', 'Greater Iron Rune' }, 3), { 'Greater Iron Rune', 'Greater Iron Rune', 'Greater Iron Rune' })
local core = 'Soul Core of Tacati'
print('installed PoB has limit flag on core?', tostring(cr.isLimitOne(core)), '| vitality?', tostring(cr.isLimitOne('Rune of Vitality')))
-- installed v0.23.1 has no `limit` field; simulate newer PoB data for limit-1 examples
for _, n in ipairs({ core, 'Rune of Vitality' }) do for _, slotMod in pairs(data.itemMods.Runes[n]) do slotMod.limit = 1 end end
print('after injecting limit=1:', tostring(cr.isLimitOne(core)), tostring(cr.isLimitOne('Rune of Vitality')))
check('3 soulcore', cr.buildCraftRunes({}, { core, 'Greater Iron Rune' }, 3), { core, 'Greater Iron Rune', 'Greater Iron Rune' })
check('4 soulcore x2', cr.buildCraftRunes({}, { core, core }, 2), { core, 'None' })
local thrud = 'Thrud\'s Might'
print('thrud bound', tostring(cr.isSocketBound(thrud)), 'medved bound', tostring(cr.isSocketBound("Medved's Tending")), 'vitality limit1', tostring(cr.isLimitOne('Rune of Vitality')))
check('5 thrud', cr.buildCraftRunes({ thrud }, { "Medved's Tending", 'Iron Rune', 'Iron Rune' }, 3), { thrud, 'Iron Rune', 'Iron Rune' })
check('6 vitality replaced', cr.buildCraftRunes({ 'Rune of Vitality' }, { 'Greater Iron Rune', 'Greater Iron Rune' }, 2), { 'Greater Iron Rune', 'Greater Iron Rune' })
local medvedC = tradeRunesOf({ 'Can roll Soul modifiers', '+30 to maximum Life' }, 2, true)
check('7 corrupted', cr.buildCraftRunes(medvedC, { 'Greater Iron Rune', 'Greater Iron Rune', 'Greater Iron Rune' }, 2), { "Medved's Tending", 'Greater Iron Rune' })

-- R4: inputs not mutated
local eq = { 'Greater Iron Rune', 'Greater Iron Rune' }
local before = snapshot(eq)
cr.buildCraftRunes(medved, eq, 5)
print((snapshot(eq) == before and 'PASS ' or 'FAIL ') .. 'R4 equipped runes untouched')
