import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { contributionTypeSchema, ContributionType } from '@shared/schema';
import { useContributions } from '@/hooks/use-contributions';
import { Loader2 } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ContributionFormProps {
  modelId: number;
  className?: string;
}

const formSchema = z.object({
  type: contributionTypeSchema,
  description: z.string().min(10, 'Description must be at least 10 characters'),
  code: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function ContributionForm({ modelId, className }: ContributionFormProps) {
  const { submitContribution, isSubmitting } = useContributions();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'code',
      description: '',
      code: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await submitContribution({
        ...data,
        modelId,
      });
      
      // Reset the form after successful submission
      form.reset();
    } catch (error) {
      console.error('Error submitting contribution:', error);
    }
  };

  const selectedType = form.watch('type');

  return (
    <div className={className}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contribution Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contribution type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="code">Code (Model Architecture)</SelectItem>
                    <SelectItem value="compute">Compute Resources</SelectItem>
                    <SelectItem value="data">Data Contribution</SelectItem>
                    <SelectItem value="hyperparameters">Hyperparameter Tuning</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your contribution..."
                    className="resize-none"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {(selectedType === 'code' || selectedType === 'hyperparameters') && (
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste your code here..."
                      className="font-mono h-32 resize-none"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Estimated reward: <span className="font-medium text-accent">5-20 NXS</span>
            </span>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Contribution'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
