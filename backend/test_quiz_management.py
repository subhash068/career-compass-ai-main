"""
Comprehensive Quiz Management Test Suite
Tests all quiz management functionality:
1. Manual question creation
2. Excel file upload
3. View questions with filters
4. Question update
5. Question deletion (single and bulk)
6. Template download
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import requests
import json
import pandas as pd
import io
from datetime import datetime

BASE_URL = "http://localhost:5000"

class QuizManagementTester:
    def __init__(self):
        self.token = None
        self.created_questions = []
        self.test_results = []
        
    def log(self, message, status="INFO"):
        """Log test results"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        status_icon = {
            "PASS": "✓",
            "FAIL": "✗",
            "WARN": "⚠",
            "INFO": "ℹ"
        }.get(status, "ℹ")
        print(f"[{timestamp}] {status_icon} {message}")
        self.test_results.append({"status": status, "message": message})
        
    def authenticate(self):
        """Authenticate as admin"""
        self.log("Authenticating as admin...", "INFO")
        
        login_data = {
            "email": "admin@careercompass.com",
            "password": "admin123"
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login", 
                json=login_data, 
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.log("Authenticated successfully", "PASS")
                return True
            else:
                self.log(f"Authentication failed: {response.status_code}", "FAIL")
                return False
                
        except requests.exceptions.ConnectionError:
            self.log(f"Cannot connect to server at {BASE_URL}", "FAIL")
            self.log("Make sure the backend server is running!", "WARN")
            return False
        except Exception as e:
            self.log(f"Authentication error: {e}", "FAIL")
            return False
    
    def test_create_question_manual(self):
        """Test 1: Manual question creation"""
        self.log("\n" + "="*60, "INFO")
        self.log("TEST 1: Manual Question Creation", "INFO")
        self.log("="*60, "INFO")
        
        if not self.token:
            self.log("No auth token, skipping test", "WARN")
            return False
        
        # Test data
        question_data = {
            "skill_id": 1,
            "question_text": "What is the output of print(2 ** 3) in Python?",
            "question_type": "multiple_choice",
            "options": ["6", "8", "9", "16"],
            "correct_answer": "8",
            "difficulty": "medium",
            "explanation": "The ** operator is exponentiation, so 2 ** 3 = 8"
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/admin/quiz/questions",
                headers={"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"},
                json=question_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                question_id = data.get('question', {}).get('id')
                self.created_questions.append(question_id)
                self.log(f"Question created (ID: {question_id})", "PASS")
                return True
            else:
                self.log(f"Failed to create question: {response.status_code}", "FAIL")
                self.log(f"Response: {response.text[:200]}", "WARN")
                return False
                
        except Exception as e:
            self.log(f"Error creating question: {e}", "FAIL")
            return False
    
    def test_view_questions(self):
        """Test 2: View questions with filters"""
        self.log("\n" + "="*60, "INFO")
        self.log("TEST 2: View Questions", "INFO")
        self.log("="*60, "INFO")
        
        if not self.token:
            self.log("No auth token, skipping test", "WARN")
            return False
        
        tests_passed = 0
        total_tests = 4
        
        # Test 2a: Basic listing
        try:
            response = requests.get(
                f"{BASE_URL}/admin/quiz/questions?limit=10",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                questions = data.get('questions', [])
                total = data.get('total', 0)
                self.log(f"Retrieved {len(questions)} questions (total: {total})", "PASS")
                tests_passed += 1
                
                # Verify question structure
                if questions:
                    q = questions[0]
                    required_fields = ['id', 'skill_id', 'question_text', 'options', 'correct_answer', 'difficulty']
                    missing = [f for f in required_fields if f not in q]
                    if missing:
                        self.log(f"Missing fields in response: {missing}", "FAIL")
                    else:
                        self.log("Question structure is valid", "PASS")
                        tests_passed += 1
            else:
                self.log(f"Failed to retrieve questions: {response.status_code}", "FAIL")
        except Exception as e:
            self.log(f"Error retrieving questions: {e}", "FAIL")
        
        # Test 2b: Filter by skill
        try:
            response = requests.get(
                f"{BASE_URL}/admin/quiz/questions?skill_id=1&limit=5",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                self.log("Skill filter working", "PASS")
                tests_passed += 1
            else:
                self.log(f"Skill filter failed: {response.status_code}", "FAIL")
        except Exception as e:
            self.log(f"Error with skill filter: {e}", "FAIL")
        
        # Test 2c: Search functionality
        try:
            response = requests.get(
                f"{BASE_URL}/admin/quiz/questions?search=Python&limit=5",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                self.log("Search functionality working", "PASS")
                tests_passed += 1
            else:
                self.log(f"Search failed: {response.status_code}", "FAIL")
        except Exception as e:
            self.log(f"Error with search: {e}", "FAIL")
        
        self.log(f"View Questions: {tests_passed}/{total_tests} tests passed", 
                 "PASS" if tests_passed == total_tests else "WARN")
        return tests_passed == total_tests
    
    def test_update_question(self):
        """Test 3: Update question"""
        self.log("\n" + "="*60, "INFO")
        self.log("TEST 3: Update Question", "INFO")
        self.log("="*60, "INFO")
        
        if not self.token or not self.created_questions:
            self.log("No auth token or created questions, skipping test", "WARN")
            return False
        
        question_id = self.created_questions[0]
        
        update_data = {
            "question_text": "Updated: What is 2 to the power of 3 in Python?",
            "difficulty": "hard",
            "explanation": "Updated explanation: 2 ** 3 = 8"
        }
        
        try:
            response = requests.put(
                f"{BASE_URL}/admin/quiz/questions/{question_id}",
                headers={"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"},
                json=update_data,
                timeout=10
            )
            
            if response.status_code == 200:
                self.log(f"Question {question_id} updated successfully", "PASS")
                return True
            else:
                self.log(f"Failed to update question: {response.status_code}", "FAIL")
                return False
                
        except Exception as e:
            self.log(f"Error updating question: {e}", "FAIL")
            return False
    
    def test_excel_upload(self):
        """Test 4: Excel file upload"""
        self.log("\n" + "="*60, "INFO")
        self.log("TEST 4: Excel File Upload", "INFO")
        self.log("="*60, "INFO")
        
        if not self.token:
            self.log("No auth token, skipping test", "WARN")
            return False
        
        # Create test Excel file
        template_data = {
            'question_text': [
                'Test Excel Question 1: What is 5 + 3?',
                'Test Excel Question 2: What is the capital of Italy?'
            ],
            'options': [
                '5, 6, 7, 8',
                'Rome, Paris, London, Berlin'
            ],
            'correct_answer': [
                '8',
                'Rome'
            ],
            'difficulty': [
                'easy',
                'medium'
            ],
            'explanation': [
                '5 + 3 = 8',
                'Rome is the capital of Italy'
            ],
            'skill_id': [1, 1]
        }
        
        df = pd.DataFrame(template_data)
        
        # Create Excel file in memory
        output = io.BytesIO()
        try:
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Questions')
        except:
            # Fallback if openpyxl not available
            self.log("openpyxl not available, trying xlsxwriter", "WARN")
            try:
                with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                    df.to_excel(writer, index=False, sheet_name='Questions')
            except:
                self.log("No Excel engine available, skipping Excel test", "WARN")
                return False
        
        output.seek(0)
        
        # Upload file
        try:
            files = {'file': ('test_questions.xlsx', output, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            data = {'skill_id': '1'}
            
            response = requests.post(
                f"{BASE_URL}/admin/quiz/upload-excel",
                headers={"Authorization": f"Bearer {self.token}"},
                files=files,
                data=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                created = result.get('created_count', 0)
                errors = result.get('error_count', 0)
                self.log(f"Excel upload: {created} questions created, {errors} errors", "PASS")
                return errors == 0
            else:
                self.log(f"Excel upload failed: {response.status_code}", "FAIL")
                self.log(f"Response: {response.text[:200]}", "WARN")
                return False
                
        except Exception as e:
            self.log(f"Error uploading Excel: {e}", "FAIL")
            return False
    
    def test_template_download(self):
        """Test 5: Template download"""
        self.log("\n" + "="*60, "INFO")
        self.log("TEST 5: Template Download", "INFO")
        self.log("="*60, "INFO")
        
        if not self.token:
            self.log("No auth token, skipping test", "WARN")
            return False
        
        try:
            response = requests.get(
                f"{BASE_URL}/admin/quiz/download-template",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                content = response.content
                content_type = response.headers.get('Content-Type', '')
                
                # Check if it's a valid Excel file
                is_excel = content[:4] == b'PK\x03\x04' or 'spreadsheet' in content_type
                
                if is_excel:
                    self.log(f"Template downloaded: {len(content)} bytes", "PASS")
                    return True
                else:
                    self.log("Downloaded file is not a valid Excel file", "FAIL")
                    return False
            else:
                self.log(f"Template download failed: {response.status_code}", "FAIL")
                return False
                
        except Exception as e:
            self.log(f"Error downloading template: {e}", "FAIL")
            return False
    
    def test_delete_questions(self):
        """Test 6: Delete questions"""
        self.log("\n" + "="*60, "INFO")
        self.log("TEST 6: Delete Questions", "INFO")
        self.log("="*60, "INFO")
        
        if not self.token:
            self.log("No auth token, skipping test", "WARN")
            return False
        
        tests_passed = 0
        
        # Test single delete
        if self.created_questions:
            question_id = self.created_questions[0]
            try:
                response = requests.delete(
                    f"{BASE_URL}/admin/quiz/questions/{question_id}",
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=10
                )
                
                if response.status_code == 200:
                    self.log(f"Single delete: Question {question_id} deleted", "PASS")
                    tests_passed += 1
                    self.created_questions.remove(question_id)
                else:
                    self.log(f"Single delete failed: {response.status_code}", "FAIL")
            except Exception as e:
                self.log(f"Error in single delete: {e}", "FAIL")
        
        # Test bulk delete
        if len(self.created_questions) > 1:
            ids_to_delete = self.created_questions[1:3]  # Delete up to 2 more
            try:
                response = requests.post(
                    f"{BASE_URL}/admin/quiz/questions/bulk-delete",
                    headers={"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"},
                    json=ids_to_delete,
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    deleted = result.get('deleted_count', 0)
                    self.log(f"Bulk delete: {deleted} questions deleted", "PASS")
                    tests_passed += 1
                else:
                    self.log(f"Bulk delete failed: {response.status_code}", "FAIL")
            except Exception as e:
                self.log(f"Error in bulk delete: {e}", "FAIL")
        
        self.log(f"Delete Tests: {tests_passed}/2 tests passed", 
                 "PASS" if tests_passed == 2 else "WARN")
        return tests_passed > 0
    
    def test_domains_with_skills(self):
        """Test 7: Get domains with skills"""
        self.log("\n" + "="*60, "INFO")
        self.log("TEST 7: Domains with Skills", "INFO")
        self.log("="*60, "INFO")
        
        if not self.token:
            self.log("No auth token, skipping test", "WARN")
            return False
        
        try:
            response = requests.get(
                f"{BASE_URL}/admin/quiz/domains-with-skills",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                domains = data.get('domains', [])
                
                if domains:
                    self.log(f"Retrieved {len(domains)} domains with skills", "PASS")
                    
                    # Check structure
                    domain = domains[0]
                    if 'id' in domain and 'name' in domain and 'skills' in domain:
                        self.log("Domain structure is valid", "PASS")
                        return True
                    else:
                        self.log("Invalid domain structure", "FAIL")
                        return False
                else:
                    self.log("No domains found", "WARN")
                    return False
            else:
                self.log(f"Failed to get domains: {response.status_code}", "FAIL")
                return False
                
        except Exception as e:
            self.log(f"Error getting domains: {e}", "FAIL")
            return False
    
    def cleanup(self):
        """Clean up any remaining test questions"""
        self.log("\n" + "="*60, "INFO")
        self.log("CLEANUP: Removing test questions", "INFO")
        self.log("="*60, "INFO")
        
        if not self.token or not self.created_questions:
            return
        
        for question_id in self.created_questions[:]:  # Copy list to avoid modification during iteration
            try:
                response = requests.delete(
                    f"{BASE_URL}/admin/quiz/questions/{question_id}",
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=5
                )
                
                if response.status_code == 200:
                    self.log(f"Cleaned up question {question_id}", "PASS")
                    self.created_questions.remove(question_id)
            except:
                pass
        
        if self.created_questions:
            self.log(f"Could not clean up {len(self.created_questions)} questions", "WARN")
    
    def generate_report(self):
        """Generate final test report"""
        self.log("\n" + "="*60, "INFO")
        self.log("TEST SUMMARY", "INFO")
        self.log("="*60, "INFO")
        
        passed = sum(1 for r in self.test_results if r['status'] == 'PASS')
        failed = sum(1 for r in self.test_results if r['status'] == 'FAIL')
        warnings = sum(1 for r in self.test_results if r['status'] == 'WARN')
        
        self.log(f"Passed: {passed}", "PASS")
        self.log(f"Failed: {failed}", "FAIL" if failed > 0 else "INFO")
        self.log(f"Warnings: {warnings}", "WARN" if warnings > 0 else "INFO")
        
        if failed == 0:
            self.log("\n✓ ALL CRITICAL TESTS PASSED!", "PASS")
        else:
            self.log(f"\n✗ {failed} TESTS FAILED", "FAIL")
        
        return failed == 0


def main():
    """Main test runner"""
    print("\n" + "="*70)
    print(" QUIZ MANAGEMENT COMPREHENSIVE TEST SUITE")
    print("="*70)
    print(f" Target: {BASE_URL}")
    print(f" Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)
    
    tester = QuizManagementTester()
    
    # Run tests
    success = True
    
    # Step 1: Authenticate
    if not tester.authenticate():
        print("\n✗ Cannot proceed without authentication")
        sys.exit(1)
    
    # Step 2: Run all tests
    tests = [
        ("Manual Question Creation", tester.test_create_question_manual),
        ("View Questions", tester.test_view_questions),
        ("Update Question", tester.test_update_question),
        ("Excel Upload", tester.test_excel_upload),
        ("Template Download", tester.test_template_download),
        ("Delete Questions", tester.test_delete_questions),
        ("Domains with Skills", tester.test_domains_with_skills),
    ]
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if not result:
                success = False
        except Exception as e:
            tester.log(f"Unexpected error in {test_name}: {e}", "FAIL")
            success = False
    
    # Step 3: Cleanup
    tester.cleanup()
    
    # Step 4: Generate report
    final_success = tester.generate_report()
    
    print("\n" + "="*70)
    sys.exit(0 if (success and final_success) else 1)


if __name__ == "__main__":
    main()
