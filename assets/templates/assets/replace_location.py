
import re

with open('hero_premium.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the exact start of the Location section
start_comment = '        <!-- \u2550\u2550 SECTION 5: LOCALIZA\u00c7\u00c3O'
start_idx = content.find(start_comment)
print(f"Start index: {start_idx}")

if start_idx == -1:
    # Try alternate encoding
    start_comment = '        <!-- \u2550\u2550 SECTION 5: LOCALIZA'
    start_idx = content.find(start_comment)
    print(f"Alt start index: {start_idx}")

if start_idx == -1:
    print("ERROR: Could not find start marker!")
    # Print characters around where it should be
    idx = content.find('SECTION 5')
    print(f"SECTION 5 at: {idx}")
    print(repr(content[max(0,idx-20):idx+100]))
else:
    # Find the </section> that closes this location section
    # The location section starts at start_idx, find the closing tag
    end_marker = '  </section>'
    end_idx = content.find(end_marker, start_idx)
    end_idx_final = end_idx + len(end_marker)
    print(f"End index: {end_idx}")
    print(f"Replaced section char count: {end_idx_final - start_idx}")
    print("Success: found both markers")
    print(f"First 200 chars: {repr(content[start_idx:start_idx+200])}")
    print(f"Last 100 chars: {repr(content[end_idx:end_idx_final])}")
