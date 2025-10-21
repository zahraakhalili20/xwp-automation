# XWP Automation - AI Agent Instructions

## 📖 **Quick Start Guide**

This documentation is split into focused modules for easier navigation and maintenance. Each file contains specific instructions for different aspects of the automation framework.

## 📂 **Instruction Modules**

### **🎯 Core Principles** 
- **[01-core-principles.md](./01-core-principles.md)** - Page Object Model patterns, code quality standards, and fundamental principles

### **🔐 Authentication & Sessions**
- **[02-authentication.md](./02-authentication.md)** - Session management, saved authentication, and login handling

### **🎭 Page Object Patterns**
- **[03-page-objects.md](./03-page-objects.md)** - Page object creation, extension, and locator usage guidelines

### **🧪 Test Organization**
- **[04-test-structure.md](./04-test-structure.md)** - Test file organization, data fixtures, and test patterns

### **📝 Code Templates**
- **[05-templates.md](./05-templates.md)** - Ready-to-use templates for page objects, tests, and utilities

### **🤖 AI Decision Making**
- **[06-ai-guidelines.md](./06-ai-guidelines.md)** - Decision trees, workflows, and AI-specific guidance

### **⚠️ Anti-Patterns & Common Mistakes**
- **[07-anti-patterns.md](./07-anti-patterns.md)** - What NOT to do, common violations, and quick fixes

### **🔧 Advanced Features**
- **[08-advanced.md](./08-advanced.md)** - SmartLogger, GraphQL integration, and performance optimization

---

## 🚀 **Quick Reference**

### **For New Tests:**
1. Read [02-authentication.md](./02-authentication.md) - **No login steps needed!**
2. Check [03-page-objects.md](./03-page-objects.md) - **Use page object methods only**
3. Review [07-anti-patterns.md](./07-anti-patterns.md) - **Avoid common mistakes**

### **For Page Objects:**
1. Start with [03-page-objects.md](./03-page-objects.md) - **Extension vs creation**
2. Use templates from [05-templates.md](./05-templates.md) - **Consistent structure**
3. Follow [01-core-principles.md](./01-core-principles.md) - **Quality standards**

### **For Debugging:**
1. Check [07-anti-patterns.md](./07-anti-patterns.md) - **Common issues**
2. Review [08-advanced.md](./08-advanced.md) - **SmartLogger usage**
3. Consult [06-ai-guidelines.md](./06-ai-guidelines.md) - **Decision guidance**

---

## 📋 **Critical Reminders**

- ✅ **Authentication**: Use saved sessions, never add login steps to functional tests
- ✅ **Page Objects**: Always use page object methods, never direct `page.click()` in tests
- ✅ **Order Independence**: Make array/tag comparisons order-independent
- ✅ **Error Handling**: Use multiple fallback strategies for robust operations
- ✅ **Extension First**: Check existing page objects before creating new ones

---

*Last Updated: October 20, 2025*