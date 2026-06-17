"use client"
import React from 'react';
import { LogOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SignOutDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const SignOutDialog: React.FC<SignOutDialogProps> = ({ open, onConfirm, onCancel }) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="flex flex-col items-center gap-3 pt-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <LogOut className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-lg font-semibold text-center">
            Sign Out
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            Are you sure you want to sign out? You will need to log in again to access your account.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter >
          <div className="flex flex-col w-full mt-1 mb-1 gap-2">
          <Button
            className="w-full cursor-pointer"
            onClick={onConfirm}
          >
            Sign Out
          </Button>
          <Button
            className="w-full cursor-pointer bg-white text-red"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignOutDialog;