"""Generate academic PDF for MDT915 Workshop 6 - Seif Sid Ali Maloufi
Uses Microsoft Edge headless to render HTML to PDF (full content, proper styling).
Falls back to fpdf2 if Edge is unavailable."""
import os
import subprocess
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_PATH = os.path.join(SCRIPT_DIR, 'MDT915_Workshop6_Submission.html')
PDF_PATH = os.path.join(SCRIPT_DIR, 'MDT915_Workshop6_SeifSidAliMaloufi_8718179.pdf')

def generate_with_edge():
    """Use Edge headless to print HTML to PDF - renders everything correctly."""
    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ]
    edge_exe = None
    for p in edge_paths:
        if os.path.exists(p):
            edge_exe = p
            break
    if not edge_exe:
        return False

    # Use file:// URL for local HTML (Windows: file:///C:/path/to/file.html)
    html_url = "file:///" + HTML_PATH.replace("\\", "/")

    cmd = [
        edge_exe,
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--print-to-pdf=" + PDF_PATH,
        "--no-pdf-header-footer",
        "--print-to-pdf-no-header",
        html_url
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return result.returncode == 0 and os.path.exists(PDF_PATH)
    except Exception:
        return False

def generate_with_fpdf():
    """Fallback: fpdf2 - may truncate on long content."""
    from fpdf import FPDF

    class AcademicPDF(FPDF):
        def __init__(self):
            super().__init__()
            self.set_auto_page_break(auto=True, margin=18)
            self.set_margins(20, 15, 20)

        def header(self):
            if self.page_no() > 1:
                self.set_font('Times', '', 9)
                self.set_text_color(100, 100, 100)
                self.cell(0, 8, 'MDT915 Workshop 6 - Seif Sid Ali Maloufi (8718179)', 0, 1, 'C')
                self.ln(4)

        def section_title(self, title):
            self.set_font('Times', 'B', 14)
            self.set_text_color(26, 53, 87)
            self.multi_cell(0, 8, title, 0, 'L')
            self.set_draw_color(26, 53, 87)
            self.line(20, self.get_y() + 2, 190, self.get_y() + 2)
            self.ln(6)

        def sub_title(self, title):
            self.set_font('Times', 'B', 11)
            self.set_text_color(50, 50, 50)
            self.multi_cell(0, 6, title, 0, 'L')
            self.ln(3)

        def body_text(self, text):
            self.set_font('Times', '', 11)
            self.set_text_color(0, 0, 0)
            self.multi_cell(0, 6, text, 0, 'J')
            self.ln(3)

        def code_block(self, code):
            self.set_font('Courier', '', 8)
            self.set_fill_color(248, 249, 250)
            self.set_draw_color(200, 200, 200)
            self.multi_cell(0, 4, code, 1, 'L', fill=True)
            self.ln(4)

    pdf = AcademicPDF()
    pdf.add_page()
    pdf.set_font('Times', '', 11)

    logo_path = os.path.join(SCRIPT_DIR, 'UOWD_logo.png')
    if os.path.exists(logo_path):
        pdf.image(logo_path, x=70, y=25, w=70)
    pdf.ln(50)

    pdf.set_font('Times', 'B', 18)
    pdf.set_text_color(26, 53, 87)
    pdf.multi_cell(0, 8, 'Smart Contract Security:\nVulnerabilities & OpenZeppelin Mitigations', 0, 'C')
    pdf.ln(6)
    pdf.set_font('Times', '', 12)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, 'MDT915 Week 4 - Session 7 - Workshop 6', 0, 1, 'C')
    pdf.ln(20)

    pdf.set_font('Times', 'B', 11)
    pdf.cell(40, 6, 'Student ID:', 0, 0)
    pdf.set_font('Times', '', 11)
    pdf.cell(0, 6, '8718179', 0, 1)
    pdf.set_font('Times', 'B', 11)
    pdf.cell(40, 6, 'Student Name:', 0, 0)
    pdf.set_font('Times', '', 11)
    pdf.cell(0, 6, 'Seif Sid Ali Maloufi', 0, 1)
    pdf.set_font('Times', 'B', 11)
    pdf.cell(40, 6, 'Date:', 0, 0)
    pdf.set_font('Times', '', 11)
    pdf.cell(0, 6, '15 March 2026', 0, 1)
    pdf.ln(10)

    pdf.add_page()
    pdf.section_title('Assignment Instructions')
    pdf.body_text('This workshop requires you to critically analyse four Smart Contract Weakness Classifications (SWC) and their corresponding OpenZeppelin mitigations.')
    pdf.body_text('1. Explain the vulnerability in your own words, including how it can be exploited on-chain')
    pdf.body_text('2. Describe the OpenZeppelin library or pattern used to mitigate the vulnerability')
    pdf.body_text('3. Compare and contrast at least two of the four vulnerabilities')
    pdf.body_text('4. Support your discussion with Solidity code snippets, examples, or references')
    pdf.ln(6)

    for q_num, q_title, vuln, vuln_code, mit, mit_code in [
        (1, 'SWC-100 - Function Default Visibility',
         'SWC-100 identifies functions that omit an explicit visibility specifier. In Solidity prior to 0.5.0, functions without explicit visibility defaulted to public. An attacker can call functions intended to be internal.',
         '// VULNERABLE\nfunction updateBalance(uint256 _newBalance) { balance = _newBalance; }',
         'Use Solidity 0.5.0+ which enforces explicit visibility. OpenZeppelin uses strict pragma (pragma solidity ^0.8.20).',
         '// FIXED\nfunction updateBalance(uint256 newBalance) internal { _balance = newBalance; }'),
        (2, 'SWC-105 - Unprotected Ether Withdrawal',
         'SWC-105 occurs when withdrawal functions lack access control. Any address can call withdraw() and drain the contract ETH balance.',
         '// VULNERABLE\nfunction withdraw() external { payable(msg.sender).transfer(address(this).balance); }',
         'Use Ownable with the onlyOwner modifier. For complex scenarios use AccessControl.',
         'function withdraw() external onlyOwner { ... }'),
        (3, 'SWC-106 - Unprotected SELFDESTRUCT',
         'SWC-106 is critical: the selfdestruct opcode can be invoked without access control. Anyone can destroy the contract and steal all ETH. Real-world: Parity Wallet (2017) - ~$300M frozen.',
         '// VULNERABLE\nfunction destroy(address payable _to) external { selfdestruct(_to); }',
         'Use Ownable with onlyOwner. For high-value contracts use AccessControl with multisig.',
         'function destroy(address payable _to) external onlyOwner { require(_to != address(0)); selfdestruct(_to); }'),
        (4, 'SWC-107 - Reentrancy',
         'SWC-107 occurs when external calls happen before state updates. A malicious contract can re-enter and drain funds repeatedly. Famous: The DAO hack (2016) - ~$60M stolen.',
         '// VULNERABLE\n(bool ok,) = msg.sender.call{value: amount}(""); balances[msg.sender] = 0;',
         'Use ReentrancyGuard with nonReentrant. Apply Checks-Effects-Interactions (CEI): update state before external calls.',
         'function withdraw() external nonReentrant { balances[msg.sender] = 0; (bool ok,) = msg.sender.call{value: amount}(""); }'),
    ]:
        pdf.section_title(f'Question {q_num}: {q_title}')
        pdf.sub_title(f'{q_num}.1 Vulnerability Explanation')
        pdf.body_text(vuln)
        pdf.code_block(vuln_code)
        pdf.sub_title(f'{q_num}.2 OpenZeppelin Mitigation')
        pdf.body_text(mit)
        pdf.code_block(mit_code)
        pdf.ln(2)

    pdf.section_title('Question 5: Comparison and Critical Analysis')
    pdf.sub_title('SWC-105 vs SWC-106')
    pdf.body_text('Similarities: Both stem from improper access control. Same mitigations (Ownable, AccessControl) apply.')
    pdf.body_text('Differences: SWC-106 is more severe - contract is permanently destroyed. SWC-105 leaves contract intact; SWC-106 has no recovery path.')
    pdf.sub_title('SWC-107 vs SWC-106')
    pdf.body_text('SWC-107 drains funds via recursive calls; SWC-106 destroys contract and steals all funds. ReentrancyGuard adds gas overhead; Ownable is lightweight.')
    pdf.ln(4)

    pdf.section_title('References')
    pdf.body_text('SWC Registry: https://swcregistry.io/ | OpenZeppelin: https://github.com/OpenZeppelin/openzeppelin-contracts')
    pdf.ln(8)
    pdf.set_font('Times', 'I', 9)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, 'MDT915 Blockchain Implementation - Workshop 6 - Seif Sid Ali Maloufi (8718179) - 15 March 2026', 0, 0, 'C')

    pdf.output(PDF_PATH)
    return True

def main():
    print('Generating PDF...')
    if generate_with_edge():
        print(f'PDF generated successfully (via Edge): {PDF_PATH}')
        return
    print('Edge headless failed, trying fpdf2...')
    if generate_with_fpdf():
        print(f'PDF generated (via fpdf2): {PDF_PATH}')
        print('For best quality with full content, open MDT915_Workshop6_Submission.html in a browser and use Print > Save as PDF')
        return
    print('ERROR: Could not generate PDF. Please open MDT915_Workshop6_Submission.html in a browser and use Print > Save as PDF')

if __name__ == '__main__':
    main()
