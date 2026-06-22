import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AddUser } from '../add-edit/add';
import { MatDialog } from '@angular/material/dialog';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { DialogComponent, DialogData } from '../../../../shared/dialog/dialog';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created: Date;
  avatar: '';
}

@Component({
  selector: 'app-user-list',
  templateUrl: './list.html',
  standalone: false,
})

export class UserList implements OnInit {
  users: User[] = [];
  filtered: User[] = [];
  selectedUsers: Set<number> = new Set();
  search = '';
  page = 1;
  pageSize = 10;
  sortKey: keyof User = 'name';
  sortAsc = true;
  contextMenuUserId: number | null = null;
  
  constructor(private dialog: MatDialog, private toast: ToastService, private cdr: ChangeDetectorRef) {}


  ngOnInit() {
    this.users = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: ['Admin', 'Editor', 'Viewer'][i % 3],
      created: new Date(Date.now() - i * 86400000),
      avatar: '',
    }));
    
    this.applyFilter();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.contextMenuUserId = null;
  }

  applyFilter() {
    this.filtered = this.users
      .filter(u =>
        u.name.toLowerCase().includes(this.search.toLowerCase()) ||
        u.email.toLowerCase().includes(this.search.toLowerCase())
      )
      .sort((a, b) => {
        const aVal = a[this.sortKey];
        const bVal = b[this.sortKey];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return this.sortAsc ? 1 : -1;
        if (bVal == null) return this.sortAsc ? -1 : 1;

        return this.sortAsc
            ? aVal > bVal ? 1 : -1
            : aVal < bVal ? 1 : -1;
        });

    const totalPages = Math.ceil(this.filtered.length / this.pageSize);
    if (this.page > totalPages) this.page = totalPages || 1;
  }

  get paged(): User[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filtered.length / this.pageSize);
  }

  nextPage() {
    if (this.page < this.totalPages) this.page++;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.page = 1;
    this.applyFilter();
  }

  setSort(key: keyof User) {
    if (this.sortKey === key) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortKey = key;
      this.sortAsc = true;
    }
    this.applyFilter();
  }

  toggleContextMenu(userId: number) {
    this.contextMenuUserId = this.contextMenuUserId === userId ? null : userId;
  }

  closeContextMenu() {
    this.contextMenuUserId = null;
  }

  deleteUser(userId: number) {
     this.Confirm('Are you sure you want to delete this User?', 'Delete User!').subscribe(result => {
      if (result === true) {
        this.users = this.users.filter(u => u.id !== userId);
        this.applyFilter();
        this.closeContextMenu();
        this.toast.success('User deleted.');
      }});
  }

  toggleSelect(userId: number) {
  this.selectedUsers.has(userId)
    ? this.selectedUsers.delete(userId)
    : this.selectedUsers.add(userId);
  }

  toggleSelectAll() {
  const allSelected = this.paged.every(u => this.selectedUsers.has(u.id));
  this.paged.forEach(u => {
    if (allSelected) {
      this.selectedUsers.delete(u.id);
    } else {
      this.selectedUsers.add(u.id);
    }
  });
  }

  isAllSelected(): boolean {
  return this.paged.every(u => this.selectedUsers.has(u.id));
  }

  addUser(): void {
    const dialogRef = this.dialog.open(AddUser, {
      width: '400px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newUser = { ...result,created: new Date(), id: 'user-' + Math.random().toString(36).substr(2, 9)};
        this.users.push(newUser);
        this.applyFilter(); 
        this.toast.success('User added.');
      }
    });

}

   Confirm(Q:string,title:string) {
        const dialogRef = this.dialog.open(DialogComponent, {
          width: '400px',
          data: <DialogData>{
            type: 'confirm',
            title: title,
            message: Q,
            confirmText:'Yes',
            cancelText: 'No',
            icon  : 'warning'
          }
        });
          return dialogRef.afterClosed();
  }
  
 editUser(user: any): void {
  const dialogRef = this.dialog.open(AddUser, {
    width: '400px',
    data: {
      user: { ...user },
      isEdit: true
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.users = this.users.map(u =>
        u.id === user.id ? { ...result, id: user.id } : u
      );
      this.toast.success('User updated.');

    }
  });

}

  
}
